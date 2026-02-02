import ChatContainer from "@/components/ChatContainer";
import UploadContainer from "@/components/UploadContainer";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <div className="flex flex-row h-full w-full">
        <div className="w-1/4">file
          <UploadContainer></UploadContainer>
        </div>
        <div className="w-3/4">
          msg
          <ChatContainer></ChatContainer>
        </div>
      </div>
    </div>
  );
}
