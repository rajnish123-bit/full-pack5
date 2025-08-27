"use client";

import ActionCard from "@/components/ActionCard";
import { QUICK_ACTIONS } from "@/constants";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import LoaderUI from "@/components/LoaderUI";
import { Loader2Icon, Sun, Moon } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";
import Chatbot from "@/components/Chatbot";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import MockInterviewSimulator from "@/components/MockInterviewSimulator";
import InterviewAnalytics from "@/components/InterviewAnalytics";

export default function Home() {
  const router = useRouter();
  const { isInterviewer, isCandidate, isLoading } = useUserRole();
  const interviews = useQuery(api.interviews.getMyInterviews);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();
  const [darkMode, setDarkMode] = useState(true); // Toggle state for dark/light mode
  const [activeAIFeature, setActiveAIFeature] = useState<"chatbot" | "resume" | "mock" | "analytics" | null>(null);

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Meeting":
        setModalType("join");
        setShowModal(true);
        break;
      default:
        router.push(`/${title.toLowerCase()}`);
    }
  };

  if (isLoading) return <LoaderUI />;

  // If an AI feature is active, show only that feature
  if (activeAIFeature === "resume") {
    return (
      <div>
        <div className="container max-w-7xl mx-auto p-6">
          <Button 
            onClick={() => setActiveAIFeature(null)} 
            variant="outline" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <ResumeAnalyzer />
      </div>
    );
  }

  if (activeAIFeature === "mock") {
    return (
      <div>
        <div className="container max-w-7xl mx-auto p-6">
          <Button 
            onClick={() => setActiveAIFeature(null)} 
            variant="outline" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <MockInterviewSimulator />
      </div>
    );
  }

  if (activeAIFeature === "analytics") {
    return (
      <div>
        <div className="container max-w-7xl mx-auto p-6">
          <Button 
            onClick={() => setActiveAIFeature(null)} 
            variant="outline" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <InterviewAnalytics />
      </div>
    );
  }

  return (
    <div >
      <div className="container max-w-7xl mx-auto p-6 bg-white text-black dark:bg-gray-950 dark:text-white">
        

        {/* WELCOME SECTION */}
        <div className="rounded-lg bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-white p-6 border border-gray-300 dark:border-gray-800 shadow-sm mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isInterviewer
              ? "Manage your interviews and review candidates effectively"
              : "Access your upcoming interviews and preparations"}
          </p>
         
        </div>

        {isInterviewer ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_ACTIONS.map((action) => (
                <ActionCard
                  key={action.title}
                  action={action}
                  onClick={() => handleQuickAction(action.title)}
                />
              ))}
            </div>
            
            {/* AI Features Section */}
            <div className="mt-10 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">🤖 AI-Powered Interview Preparation</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                    onClick={() => setActiveAIFeature("resume")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📄</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Resume Analyzer</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your resume and get personalized interview questions with AI analysis
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                    onClick={() => setActiveAIFeature("mock")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎭</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Mock Interview</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice with AI-powered mock interviews and get real-time feedback
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                    onClick={() => setActiveAIFeature("analytics")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Performance Analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        Track your progress with detailed analytics and improvement insights
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Chatbot Section */}
              {activeAIFeature === "chatbot" || activeAIFeature === null ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">💬 AI Interview Assistant</h2>
                    {activeAIFeature !== "chatbot" && (
                      <Button 
                        onClick={() => setActiveAIFeature("chatbot")} 
                        variant="outline"
                      >
                        Expand Chatbot
                      </Button>
                    )}
                    {activeAIFeature === "chatbot" && (
                      <Button 
                        onClick={() => setActiveAIFeature(null)} 
                        variant="outline"
                      >
                        Minimize
                      </Button>
                    )}
                  </div>
                  <Chatbot />
                </div>
              )}
            </div>
            <MeetingModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
              isJoinMeeting={modalType === "join"}
            />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Your Interviews</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and join your scheduled interviews</p>
            </div>

            <div className="mt-8">
              {interviews === undefined ? (
                <div className="flex justify-center py-12">
                  <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : interviews.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {interviews.map((interview) => (
                    <MeetingCard key={interview._id} interview={interview} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  You have no scheduled interviews at the moment
                </div>
              )}
              
            </div>
          </>
        )}

      </div>
    </div>
  );
}
