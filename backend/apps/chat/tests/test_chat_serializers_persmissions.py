# backend/apps/chat/tests/test_chat_serializers_persmissions.py
import pytest
from apps.chat.serializers import DirectCreateSerializer, MessageCreateSerializer
from apps.chat.permissions import IsConversationMember

pytestmark = pytest.mark.django_db


def test_direct_serializer_validates_peer_id(rf, two_users):
    u1, u2 = two_users
    req = rf.post("/api/v1/chat/conversations/direct/", {"peer_id": u2.id})
    req.user = u1
    ser = DirectCreateSerializer(data={"peer_id": str(u2.id)}, context={"request": req})
    assert ser.is_valid(), ser.errors
    assert ser.validated_data["peer_id"] == str(u2.id)


def test_message_create_serializer_strips_text(rf, two_users):
    u1, _ = two_users
    req = rf.post("/api/v1/chat/conversations/any/send/", {"text": "  hello  "})
    req.user = u1
    ser = MessageCreateSerializer(data={"text": "  hello  "}, context={"request": req})
    assert ser.is_valid(), ser.errors
    assert ser.validated_data["text"] == "hello"


def test_is_conversation_member_permission_allows_member(two_users, make_direct):
    conv, u1, _ = make_direct()
    perm = IsConversationMember()

    class DummyReq:
        pass

    req = DummyReq()
    req.user = u1
    assert perm.has_object_permission(req, None, conv) is True
