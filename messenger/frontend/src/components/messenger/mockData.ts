import sarahAvatar from "@/assets/images/sarah.png";
import davidAvatar from "@/assets/images/david.png";
import elenaAvatar from "@/assets/images/elena.png";

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

export const mockContacts: Contact[] = [
  {
    id: "1",
    name: "#General",
    avatar: sarahAvatar,
    lastMessage: "I'll push the latest changes now.",
    lastMessageTime: "10:42 AM",
    unread: 3,
    online: true,
    messages: [
      { id: "m1", text: "Has anyone seen the new design specs?", timestamp: "10:30 AM", isOutgoing: false },
      { id: "m2", text: "Yeah, they look incredible. The neon accents are perfect.", timestamp: "10:32 AM", isOutgoing: true },
      { id: "m3", text: "Just waiting on the final assets.", timestamp: "10:35 AM", isOutgoing: false },
      { id: "m4", text: "I'll push the latest changes now.", timestamp: "10:42 AM", isOutgoing: false },
    ]
  },
  {
    id: "2",
    name: "David Chen",
    avatar: davidAvatar,
    lastMessage: "Sounds good, see you then.",
    lastMessageTime: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Are we still on for the 3PM sync?", timestamp: "Yesterday 2:00 PM", isOutgoing: true },
      { id: "m2", text: "Yes, I have the prototypes ready.", timestamp: "Yesterday 2:15 PM", isOutgoing: false },
      { id: "m3", text: "Sounds good, see you then.", timestamp: "Yesterday 2:20 PM", isOutgoing: true },
    ]
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    avatar: elenaAvatar,
    lastMessage: "Could you review my PR?",
    lastMessageTime: "Mon",
    unread: 1,
    online: true,
    messages: [
      { id: "m1", text: "Hey, are you free to take a look at something?", timestamp: "Mon 9:00 AM", isOutgoing: false },
      { id: "m2", text: "Could you review my PR?", timestamp: "Mon 9:05 AM", isOutgoing: false },
    ]
  },
  {
    id: "4",
    name: "Design Team",
    avatar: sarahAvatar,
    lastMessage: "The dark mode palette is approved.",
    lastMessageTime: "Sun",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "The dark mode palette is approved.", timestamp: "Sun 4:30 PM", isOutgoing: false },
    ]
  },
  {
    id: "5",
    name: "System Alerts",
    avatar: elenaAvatar,
    lastMessage: "Build #4092 successful.",
    lastMessageTime: "Fri",
    unread: 0,
    online: true,
    messages: [
      { id: "m1", text: "Build #4092 successful.", timestamp: "Fri 11:11 PM", isOutgoing: false },
    ]
  },
  {
    id: "6",
    name: "Marcus Thorne",
    avatar: davidAvatar,
    lastMessage: "Let's sync up later this week.",
    lastMessageTime: "Thu",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Let's sync up later this week.", timestamp: "Thu 2:15 PM", isOutgoing: false },
    ]
  },
  {
    id: "7",
    name: "Olivia Vance",
    avatar: sarahAvatar,
    lastMessage: "Got the assets, thanks!",
    lastMessageTime: "Wed",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Here are the assets", timestamp: "Wed 10:00 AM", isOutgoing: true },
      { id: "m2", text: "Got the assets, thanks!", timestamp: "Wed 10:15 AM", isOutgoing: false },
    ]
  }
];