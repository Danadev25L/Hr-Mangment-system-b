import { eq, or, and } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { messages, users } from '../../../db/schema.js';

/**
 * Shared Messaging System Controller
 * Handles message operations for all user roles with proper access control
 */

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Content cannot be empty!"
      });
    }

    const senderId = req.user.id;
    
    // Validate receiver exists
    const receiver = await db.select()
      .from(users)
      .where(eq(users.id, req.body.receiverId))
      .limit(1);
    
    if (receiver.length === 0) {
      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    // Create message
    const newMessage = {
      text: req.body.text?.trim(),
      receiverId: parseInt(req.body.receiverId),
      senderId: senderId,
      isRead: false,
      sentAt: new Date()
    };

    if (!newMessage.text) {
      return res.status(400).json({
        message: "Message text is required"
      });
    }

    // Save message in the database
    const result = await db.insert(messages)
      .values(newMessage)
      .returning();
    
    // Get message with sender and receiver info
    const messageWithUsers = await db.select({
      id: messages.id,
      text: messages.text,
      isRead: messages.isRead,
      sentAt: messages.sentAt,
      sender: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role
      }
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.id, result[0].id))
    .limit(1);
    
    res.json({
      message: "Message sent successfully",
      messageData: messageWithUsers[0]
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while sending the message."
    });
  }
};

// Get conversation between current user and another user
export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId);
    
    // Validate other user exists
    const otherUser = await db.select()
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);
    
    if (otherUser.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Get all messages between the two users
    const conversation = await db.select({
      id: messages.id,
      text: messages.text,
      isRead: messages.isRead,
      sentAt: messages.sentAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      sender: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role
      }
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      or(
        and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
      )
    )
    .orderBy(messages.sentAt);
    
    res.json({
      message: "Conversation retrieved successfully",
      conversation,
      participants: {
        currentUser: {
          id: currentUserId,
          fullName: req.user.fullName,
          username: req.user.username,
          role: req.user.role
        },
        otherUser: otherUser[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving conversation."
    });
  }
};

// Get all conversations for current user (list of people they've messaged with)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all unique conversations for the current user
    const conversations = await db.select({
      userId: users.id,
      fullName: users.fullName,
      username: users.username,
      role: users.role,
      lastMessage: messages.text,
      lastMessageTime: messages.sentAt,
      isLastMessageRead: messages.isRead,
      lastMessageSenderId: messages.senderId
    })
    .from(messages)
    .leftJoin(users, 
      or(
        and(eq(messages.senderId, users.id), eq(messages.receiverId, currentUserId)),
        and(eq(messages.receiverId, users.id), eq(messages.senderId, currentUserId))
      )
    )
    .where(
      or(
        eq(messages.senderId, currentUserId),
        eq(messages.receiverId, currentUserId)
      )
    )
    .orderBy(messages.sentAt);

    // Process to get unique conversations with latest messages
    const conversationMap = new Map();
    
    conversations.forEach(conv => {
      const otherUserId = conv.lastMessageSenderId === currentUserId ? 
        (conv.userId === currentUserId ? null : conv.userId) : 
        conv.userId;
      
      if (otherUserId && otherUserId !== currentUserId) {
        if (!conversationMap.has(otherUserId) || 
            new Date(conv.lastMessageTime) > new Date(conversationMap.get(otherUserId).lastMessageTime)) {
          conversationMap.set(otherUserId, {
            user: {
              id: conv.userId,
              fullName: conv.fullName,
              username: conv.username,
              role: conv.role
            },
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            isLastMessageRead: conv.isLastMessageRead,
            isLastMessageFromMe: conv.lastMessageSenderId === currentUserId
          });
        }
      }
    });

    const uniqueConversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    res.json({
      message: "Conversations retrieved successfully",
      conversations: uniqueConversations
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving conversations."
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId);
    
    // Mark all unread messages from the other user as read
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, currentUserId),
          eq(messages.isRead, false)
        )
      )
      .returning();
    
    res.json({
      message: `${result.length} messages marked as read`,
      markedCount: result.length
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while marking messages as read."
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const unreadMessages = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, currentUserId),
          eq(messages.isRead, false)
        )
      );
    
    res.json({
      message: "Unread count retrieved successfully",
      unreadCount: unreadMessages.length
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while retrieving unread count."
    });
  }
};

// Get single message (only if user is sender or receiver)
export const getMessage = async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    
    const result = await db.select({
      id: messages.id,
      text: messages.text,
      isRead: messages.isRead,
      sentAt: messages.sentAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      sender: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role
      }
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        eq(messages.id, messageId),
        or(
          eq(messages.senderId, currentUserId),
          eq(messages.receiverId, currentUserId)
        )
      )
    )
    .limit(1);
    
    if (result.length > 0) {
      res.json({
        message: "Message retrieved successfully",
        messageData: result[0]
      });
    } else {
      res.status(404).json({
        message: `Message with id=${messageId} not found or access denied.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Error retrieving message with id=${req.params.id}`
    });
  }
};

// Delete a message (only sender can delete)
export const deleteMessage = async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    
    // Check if message exists and user is the sender
    const existingMessage = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.senderId, currentUserId)
        )
      )
      .limit(1);
    
    if (existingMessage.length === 0) {
      return res.status(404).json({
        message: "Message not found or you don't have permission to delete it"
      });
    }
    
    const result = await db.delete(messages)
      .where(eq(messages.id, messageId))
      .returning();
    
    if (result.length > 0) {
      res.json({
        message: "Message deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete message with id=${messageId}.`
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Could not delete message with id=${req.params.id}`
    });
  }
};

// Search messages (current user's messages only)
export const searchMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      return res.status(400).json({
        message: "Search term is required"
      });
    }
    
    const results = await db.select({
      id: messages.id,
      text: messages.text,
      isRead: messages.isRead,
      sentAt: messages.sentAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      sender: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role
      }
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        or(
          eq(messages.senderId, currentUserId),
          eq(messages.receiverId, currentUserId)
        )
        // Note: Add text search functionality based on your database capabilities
      )
    )
    .orderBy(messages.sentAt);
    
    // Filter by text content (basic search - enhance based on your needs)
    const filteredResults = results.filter(msg => 
      msg.text && msg.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    res.json({
      message: "Message search completed",
      results: filteredResults,
      searchTerm,
      count: filteredResults.length
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Some error occurred while searching messages."
    });
  }
};