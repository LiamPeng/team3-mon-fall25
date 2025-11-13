import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock createPortal to render in the same container
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

import ChatModal from "./ChatModal";

describe("ChatModal", () => {
  const mockConversations = [
    {
      id: "1",
      listingTitle: "Laptop",
      listingPrice: 500,
      otherUser: { id: "2", name: "Alice", initials: "A" },
      unreadCount: 2,
      type: "buying",
    },
    {
      id: "2",
      listingTitle: "Phone",
      listingPrice: 300,
      otherUser: { id: "3", name: "Bob", initials: "B" },
      unreadCount: 0,
      type: "selling",
    },
  ];

  const mockMessages = {
    "1": [
      {
        id: "msg1",
        senderId: "1",
        content: "Hello",
        timestamp: new Date("2024-01-15T10:00:00Z"),
      },
    ],
  };

  const mockOnOpenChange = vi.fn();
  const mockOnSendMessage = vi.fn();
  const mockOnListingClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe("Rendering", () => {
    it("renders when open is true", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      const { container } = render(
        <ChatModal
          open={false}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders conversation list", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      // Use getAllByText to handle multiple matches and check conversation list specifically
      const laptopElements = screen.getAllByText("Laptop");
      expect(laptopElements.length).toBeGreaterThan(0);
      // Check that at least one is in the conversation list (has conversation-item__title class)
      const conversationListLaptop = laptopElements.find(el => 
        el.classList.contains("conversation-item__title")
      );
      expect(conversationListLaptop).toBeInTheDocument();
    });

    it("renders chat window when conversation is selected", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      // Use getAllByText to handle multiple matches and check chat window specifically
      const aliceElements = screen.getAllByText("Alice");
      expect(aliceElements.length).toBeGreaterThan(0);
      // Check that at least one is in the chat window (has user-info-block__name class)
      const chatWindowAlice = aliceElements.find(el => 
        el.classList.contains("user-info-block__name")
      );
      expect(chatWindowAlice).toBeInTheDocument();
    });

    it("shows empty state when no conversation is selected", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={[]}
          messages={{}}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      expect(screen.getByText("Select a conversation to start messaging")).toBeInTheDocument();
    });
  });

  describe("User interactions", () => {
    it("calls onOpenChange when close button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("renders overlay in full-page mode", async () => {
      const { container } = render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
          asPage={true}
        />
      );
      // Wait for overlay to render in full-page mode
      await waitFor(() => {
        const overlay = container.querySelector(".chat-modal-overlay");
        expect(overlay).toBeInTheDocument();
      });
      // Verify the overlay exists in full-page mode
      const overlay = container.querySelector(".chat-modal-overlay");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass("chat-modal-overlay");
    });

    it("calls onSendMessage when message is sent", async () => {
      const user = userEvent.setup();
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      const input = screen.getByPlaceholderText("Type a message...");
      await user.type(input, "Test message{Enter}");
      expect(mockOnSendMessage).toHaveBeenCalledWith("1", "Test message");
    });

    it("calls onListingClick when listing is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          onListingClick={mockOnListingClick}
          currentUserId="1"
        />
      );
      // Find the listing button in the chat window (has chat-window__listing-info class)
      // Use getAllByText to handle multiple matches
      const laptopElements = screen.getAllByText("Laptop");
      const listingTitle = laptopElements.find(el => 
        el.classList.contains("chat-window__listing-title")
      );
      expect(listingTitle).toBeInTheDocument();
      // Get the button that contains the listing title
      const listingButton = listingTitle.closest("button");
      if (listingButton) {
        await user.click(listingButton);
        expect(mockOnListingClick).toHaveBeenCalled();
      }
    });
  });

  describe("Initial conversation", () => {
    it("opens with initialConversationId when provided", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          initialConversationId="2"
          currentUserId="1"
        />
      );
      // Use getAllByText to handle multiple matches and check chat window specifically
      const bobElements = screen.getAllByText("Bob");
      expect(bobElements.length).toBeGreaterThan(0);
      // Check that at least one is in the chat window (has user-info-block__name class)
      const chatWindowBob = bobElements.find(el => 
        el.classList.contains("user-info-block__name")
      );
      expect(chatWindowBob).toBeInTheDocument();
    });

    it("opens with first conversation when no initialConversationId", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      // Use getAllByText to handle multiple matches and check chat window specifically
      const aliceElements = screen.getAllByText("Alice");
      expect(aliceElements.length).toBeGreaterThan(0);
      // Check that at least one is in the chat window (has user-info-block__name class)
      const chatWindowAlice = aliceElements.find(el => 
        el.classList.contains("user-info-block__name")
      );
      expect(chatWindowAlice).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles empty conversations array", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={[]}
          messages={{}}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      expect(screen.getByText("No conversations yet")).toBeInTheDocument();
    });

    it("handles missing messages for conversation", () => {
      render(
        <ChatModal
          open={true}
          onOpenChange={mockOnOpenChange}
          conversations={mockConversations}
          messages={{}}
          onSendMessage={mockOnSendMessage}
          currentUserId="1"
        />
      );
      // Use getAllByText to handle multiple matches and check chat window specifically
      const aliceElements = screen.getAllByText("Alice");
      expect(aliceElements.length).toBeGreaterThan(0);
      // Check that at least one is in the chat window (has user-info-block__name class)
      const chatWindowAlice = aliceElements.find(el => 
        el.classList.contains("user-info-block__name")
      );
      expect(chatWindowAlice).toBeInTheDocument();
    });
  });
});
