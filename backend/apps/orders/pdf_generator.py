"""
===========================================
Order PDF Generator
===========================================
"""
import io
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


def generate_order_pdf(order):
    """สร้าง PDF สำหรับคำสั่งซื้อ"""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
    )
    
    # Title
    elements.append(Paragraph("ใบสั่งซื้อ / Order Invoice", title_style))
    elements.append(Spacer(1, 20))
    
    # Order Info
    elements.append(Paragraph("ข้อมูลคำสั่งซื้อ", header_style))
    
    order_info = [
        ["หมายเลขคำสั่งซื้อ:", f"#{order.id}"],
        ["วันที่สั่งซื้อ:", order.created_at.strftime("%d/%m/%Y %H:%M")],
        ["สถานะ:", get_status_display(order.status)],
        ["วิธีชำระเงิน:", get_payment_display(order.payment_method) if hasattr(order, 'payment_method') else "-"],
    ]
    
    order_table = Table(order_info, colWidths=[4*cm, 10*cm])
    order_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
    ]))
    elements.append(order_table)
    elements.append(Spacer(1, 20))
    
    # Customer Info
    elements.append(Paragraph("ข้อมูลลูกค้า", header_style))
    
    customer_info = [
        ["ชื่อ:", order.user.username if order.user else "-"],
        ["อีเมล:", order.user.email if order.user else "-"],
        ["ที่อยู่จัดส่ง:", order.shipping_address if hasattr(order, 'shipping_address') and order.shipping_address else "-"],
        ["เบอร์โทร:", order.phone if hasattr(order, 'phone') and order.phone else "-"],
    ]
    
    customer_table = Table(customer_info, colWidths=[4*cm, 10*cm])
    customer_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 20))
    
    # Order Items
    elements.append(Paragraph("รายการสินค้า", header_style))
    
    # Table Header
    items_data = [
        ["#", "สินค้า", "ราคา", "จำนวน", "รวม"]
    ]
    
    # Table Rows
    for idx, item in enumerate(order.items.all(), 1):
        items_data.append([
            str(idx),
            item.product.name if item.product else "สินค้าถูกลบ",
            f"{item.price:,.2f}",
            str(item.quantity),
            f"{item.price * item.quantity:,.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[1*cm, 8*cm, 2.5*cm, 2*cm, 2.5*cm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EE4D2D')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Alignment
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # Summary
    elements.append(Paragraph("สรุปยอด", header_style))
    
    subtotal = sum(item.price * item.quantity for item in order.items.all())
    shipping = getattr(order, 'shipping_cost', 0) or 0
    discount = getattr(order, 'discount', 0) or 0
    total = order.total_amount if hasattr(order, 'total_amount') else subtotal
    
    summary_data = [
        ["ยอดรวมสินค้า:", f"{subtotal:,.2f} บาท"],
        ["ค่าจัดส่ง:", f"{shipping:,.2f} บาท"],
        ["ส่วนลด:", f"-{discount:,.2f} บาท"],
        ["ยอดชำระทั้งหมด:", f"{total:,.2f} บาท"],
    ]
    
    summary_table = Table(summary_data, colWidths=[10*cm, 4*cm])
    summary_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        # Total row
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#EE4D2D')),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.grey),
        ('TOPPADDING', (0, -1), (-1, -1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=1,
    )
    elements.append(Paragraph("ขอบคุณที่ใช้บริการ MuangThai Shop", footer_style))
    elements.append(Paragraph("เอกสารนี้สร้างโดยระบบอัตโนมัติ", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer


def get_status_display(status):
    """แปลงสถานะเป็นภาษาไทย"""
    status_map = {
        'pending': 'รอดำเนินการ',
        'confirmed': 'ยืนยันแล้ว',
        'processing': 'กำลังเตรียมสินค้า',
        'shipped': 'จัดส่งแล้ว',
        'delivered': 'ส่งถึงแล้ว',
        'cancelled': 'ยกเลิก',
        'refunded': 'คืนเงินแล้ว',
    }
    return status_map.get(status, status)


def get_payment_display(payment_method):
    """แปลงวิธีชำระเงินเป็นภาษาไทย"""
    payment_map = {
        'cod': 'เก็บเงินปลายทาง',
        'transfer': 'โอนเงิน',
        'credit_card': 'บัตรเครดิต',
        'promptpay': 'พร้อมเพย์',
    }
    return payment_map.get(payment_method, payment_method or '-')