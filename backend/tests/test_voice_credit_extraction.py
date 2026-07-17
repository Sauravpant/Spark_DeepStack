from app.schemas.voice import VoiceAction, VoiceLineItem, VoiceTransactionEntry
from app.services.voice_service import sanitize_extracted_response


def test_sanitize_extracted_response_disables_credit_and_customer_inference():
    extracted = sanitize_extracted_response(
        items=[VoiceLineItem(action=VoiceAction.sale, product="कोक", quantity=2, unit="वटा")],
        customer_name="राम",
        payment_type="credit",
        notes="Credit sale",
        transactions=[
            VoiceTransactionEntry(
                action=VoiceAction.sale,
                items=[VoiceLineItem(action=VoiceAction.sale, product="कोक", quantity=2, unit="वटा")],
                customer_name="राम",
                payment_type="credit",
                due_date="2026-07-20",
                notes="Credit sale",
            )
        ],
    )

    assert extracted.customer_name is None
    assert extracted.payment_type == "cash"
    assert extracted.notes is None
    assert extracted.transactions[0].customer_name is None
    assert extracted.transactions[0].payment_type == "cash"
    assert extracted.transactions[0].due_date is None
