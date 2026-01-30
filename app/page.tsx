import ChatContainer from "@/components/ChatContainer";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <div className="flex flex-row h-full w-full">
        <div className="w-1/4">file</div>
        <div className="w-3/4">
          msg
          <ChatContainer></ChatContainer>
        </div>
      </div>
    </div>
  );
}
