import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ContactsSidebar, SidebarView } from "@/components/messenger/ContactsSidebar";
import { ChatPane } from "@/components/messenger/ChatPane";
import { MusicPlayer } from "@/components/messenger/MusicPlayer";
import { mockContacts } from "@/components/messenger/mockData";

const queryClient = new QueryClient();

function Messenger() {
  const [activeContactId, setActiveContactId] = useState<string>(mockContacts[0].id);
  const [sidebarView, setSidebarView] = useState<SidebarView>("contacts");

  const activeContact = mockContacts.find((c) => c.id === activeContactId);

  return (
    <div className="dark h-screen w-full flex overflow-hidden bg-neutral-950 text-neutral-100">
      <ContactsSidebar
        contacts={mockContacts}
        activeContactId={activeContactId}
        onSelectContact={(id) => {
          setActiveContactId(id);
          setSidebarView("contacts");
        }}
        view={sidebarView}
        onChangeView={setSidebarView}
        activeContact={activeContact}
      />
      <ChatPane contact={activeContact} onTitleClick={() => setSidebarView("contact")} />
      <MusicPlayer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Messenger} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
