import MessageCard from "./MessageCard";

export default function BetaNoticeCard({
  message = "You can continue using the free practice limits.",
  title = "Premium purchases are not available in this beta build yet."
}) {
  return <MessageCard message={message} title={title} tone="warning" />;
}
