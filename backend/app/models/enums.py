from enum import Enum


class LocationType(str, Enum):
    URBAN = "urban"
    SEMI_URBAN = "semi_urban"
    RURAL = "rural"


class PaymentType(str, Enum):
    CASH = "cash"
    CREDIT = "credit"
    QR = "qr"


class CreditStatus(str, Enum):
    PAID = "paid"
    UNPAID = "unpaid"
    OVERDUE = "overdue"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"