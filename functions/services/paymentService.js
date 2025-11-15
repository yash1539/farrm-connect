// Payment Service - Supports dummy, Razorpay, and PhonePe
// Currently using dummy implementation, can be switched to real gateways

// Payment gateway configuration
const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'dummy'; // 'dummy', 'razorpay', 'phonepay'

// Dummy Payment Implementation
class DummyPaymentService {
  async createPayment(orderData) {
    // Generate dummy payment ID
    const paymentId = `pay_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      paymentId,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      status: 'created',
      gateway: 'dummy',
      paymentData: {
        key: 'dummy_key',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: paymentId,
        name: orderData.customerName || 'Customer',
        description: orderData.description || 'Order Payment',
        prefill: {
          email: orderData.email || 'customer@example.com',
          contact: orderData.phone || '9876543210'
        },
        notes: {
          orderId: orderData.orderId,
          orderType: orderData.orderType
        }
      },
      // For frontend integration
      checkoutUrl: `https://dummy-payment-gateway.com/checkout/${paymentId}`,
      // For testing - simulate payment
      testPaymentUrl: `https://api.example.com/payment/verify/${paymentId}?status=success`
    };
  }

  async verifyPayment(paymentId, paymentData) {
    // Dummy verification - always succeeds for testing
    // In real implementation, verify with payment gateway
    
    return {
      success: true,
      paymentId,
      status: paymentData.status || 'captured',
      amount: paymentData.amount,
      currency: paymentData.currency || 'INR',
      method: paymentData.method || 'card',
      gateway: 'dummy',
      verifiedAt: new Date().toISOString()
    };
  }

  async getPaymentStatus(paymentId) {
    // Dummy status check
    return {
      success: true,
      paymentId,
      status: 'captured',
      amount: 0,
      currency: 'INR',
      gateway: 'dummy'
    };
  }

  async refundPayment(paymentId, amount) {
    // Dummy refund
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      paymentId,
      amount,
      status: 'processed',
      gateway: 'dummy'
    };
  }
}

// Razorpay Payment Implementation (Placeholder - ready for integration)
class RazorpayPaymentService {
  constructor() {
    // Will be initialized with Razorpay credentials
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
    // const Razorpay = require('razorpay');
    // this.razorpay = new Razorpay({
    //   key_id: this.keyId,
    //   key_secret: this.keySecret
    // });
  }

  async createPayment(orderData) {
    // TODO: Implement Razorpay payment creation
    // const order = await this.razorpay.orders.create({
    //   amount: orderData.amount * 100, // Convert to paise
    //   currency: orderData.currency || 'INR',
    //   receipt: orderData.orderId,
    //   notes: {
    //     orderId: orderData.orderId,
    //     orderType: orderData.orderType
    //   }
    // });
    
    // For now, return dummy response
    return {
      success: true,
      paymentId: `pay_razorpay_${Date.now()}`,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      status: 'created',
      gateway: 'razorpay',
      paymentData: {
        key: this.keyId,
        amount: orderData.amount * 100, // In paise
        currency: orderData.currency || 'INR',
        order_id: `order_${Date.now()}`,
        name: orderData.customerName || 'Customer',
        description: orderData.description || 'Order Payment'
      }
    };
  }

  async verifyPayment(paymentId, paymentData) {
    // TODO: Implement Razorpay payment verification
    // const crypto = require('crypto');
    // const generatedSignature = crypto
    //   .createHmac('sha256', this.keySecret)
    //   .update(paymentData.razorpay_order_id + '|' + paymentData.razorpay_payment_id)
    //   .digest('hex');
    // 
    // if (generatedSignature === paymentData.razorpay_signature) {
    //   return { success: true, ... };
    // }
    
    return {
      success: true,
      paymentId,
      status: 'captured',
      gateway: 'razorpay'
    };
  }

  async getPaymentStatus(paymentId) {
    // TODO: Implement Razorpay status check
    return {
      success: true,
      paymentId,
      status: 'captured',
      gateway: 'razorpay'
    };
  }

  async refundPayment(paymentId, amount) {
    // TODO: Implement Razorpay refund
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      paymentId,
      amount,
      gateway: 'razorpay'
    };
  }
}

// PhonePe Payment Implementation (Placeholder - ready for integration)
class PhonePePaymentService {
  constructor() {
    // Will be initialized with PhonePe credentials
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'dummy_merchant';
    this.saltKey = process.env.PHONEPE_SALT_KEY || 'dummy_salt';
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    this.baseUrl = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
  }

  async createPayment(orderData) {
    // TODO: Implement PhonePe payment creation
    // const payload = {
    //   merchantId: this.merchantId,
    //   merchantTransactionId: `TXN_${Date.now()}`,
    //   amount: orderData.amount * 100, // In paise
    //   redirectUrl: `${process.env.BASE_URL}/payment/callback`,
    //   redirectMode: 'REDIRECT',
    //   callbackUrl: `${process.env.BASE_URL}/api/payment/callback`,
    //   mobileNumber: orderData.phone,
    //   paymentInstrument: {
    //     type: 'PAY_PAGE'
    //   }
    // };
    
    return {
      success: true,
      paymentId: `pay_phonepe_${Date.now()}`,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      status: 'created',
      gateway: 'phonepay',
      paymentData: {
        merchantId: this.merchantId,
        transactionId: `TXN_${Date.now()}`,
        amount: orderData.amount * 100
      },
      checkoutUrl: `${this.baseUrl}/pg/v1/pay`
    };
  }

  async verifyPayment(paymentId, paymentData) {
    // TODO: Implement PhonePe payment verification
    return {
      success: true,
      paymentId,
      status: 'SUCCESS',
      gateway: 'phonepay'
    };
  }

  async getPaymentStatus(paymentId) {
    // TODO: Implement PhonePe status check
    return {
      success: true,
      paymentId,
      status: 'SUCCESS',
      gateway: 'phonepay'
    };
  }

  async refundPayment(paymentId, amount) {
    // TODO: Implement PhonePe refund
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      paymentId,
      amount,
      gateway: 'phonepay'
    };
  }
}

// Payment Service Factory
class PaymentServiceFactory {
  static getService(gateway = PAYMENT_GATEWAY) {
    switch (gateway.toLowerCase()) {
      case 'razorpay':
        return new RazorpayPaymentService();
      case 'phonepay':
      case 'phonepe':
        return new PhonePePaymentService();
      case 'dummy':
      default:
        return new DummyPaymentService();
    }
  }
}

module.exports = {
  PaymentServiceFactory,
  DummyPaymentService,
  RazorpayPaymentService,
  PhonePePaymentService
};

