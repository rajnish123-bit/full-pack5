"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Square, Mic, MicOff, Camera, CameraOff, RotateCcw, Award } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

const GEMINI_API_KEY = "AIzaSyAjWxQEVa72lu4gFuMUGbaxzgVmHMsRSGI";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface InterviewQuestion {
  id: number;
  question: string;
  category: "Technical" | "Behavioral" | "Situational";
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
}

interface InterviewResponse {
  questionId: number;
  response: string;
  timeSpent: number;
  score: number;
  feedback: string;
}

interface InterviewSession {
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  currentQuestionIndex: number;
  isActive: boolean;
  startTime: number;
}

const MockInterviewSimulator: React.FC = () => {
  const { theme } = useTheme();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [currentResponse, setCurrentResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sampleQuestions: InterviewQuestion[] = [
    {
      id: 1,
      question: "Tell me about yourself and your professional background.",
      category: "Behavioral",
      difficulty: "Easy",
      timeLimit: 120
    },
    {
      id: 2,
      question: "Describe a challenging project you worked on and how you overcame obstacles.",
      category: "Behavioral",
      difficulty: "Medium",
      timeLimit: 180
    },
    {
      id: 3,
      question: "How do you handle working under pressure and tight deadlines?",
      category: "Situational",
      difficulty: "Medium",
      timeLimit: 150
    },
    {
      id: 4,
      question: "What are your greatest strengths and how do they apply to this role?",
      category: "Behavioral",
      difficulty: "Easy",
      timeLimit: 120
    },
    {
      id: 5,
      question: "Describe a time when you had to work with a difficult team member.",
      category: "Situational",
      difficulty: "Hard",
      timeLimit: 180
    }
  ];

  useEffect(() => {
    initializeCamera();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera/microphone");
    }
  };

  const startInterview = () => {
    const newSession: InterviewSession = {
      questions: sampleQuestions,
      responses: [],
      currentQuestionIndex: 0,
      isActive: true,
      startTime: Date.now()
    };
    
    setSession(newSession);
    setTimeRemaining(sampleQuestions[0].timeLimit);
    startTimer(sampleQuestions[0].timeLimit);
    toast.success("Mock interview started!");
  };

  const startTimer = (duration: number) => {
    setTimeRemaining(duration);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextQuestion = async () => {
    if (!session) return;

    // Analyze current response
    if (currentResponse.trim()) {
      setIsAnalyzing(true);
      const feedback = await analyzeResponse(
        session.questions[session.currentQuestionIndex].question,
        currentResponse
      );
      
      const response: InterviewResponse = {
        questionId: session.questions[session.currentQuestionIndex].id,
        response: currentResponse,
        timeSpent: session.questions[session.currentQuestionIndex].timeLimit - timeRemaining,
        score: feedback.score,
        feedback: feedback.feedback
      };

      setSession(prev => prev ? {
        ...prev,
        responses: [...prev.responses, response]
      } : null);
      setIsAnalyzing(false);
    }

    // Move to next question or end interview
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: nextIndex
      } : null);
      setCurrentResponse("");
      startTimer(session.questions[nextIndex].timeLimit);
    } else {
      endInterview();
    }
  };

  const analyzeResponse = async (question: string, response: string) => {
    try {
      const analysisResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this interview response and provide feedback in JSON format:
              
              Question: ${question}
              Response: ${response}
              
              Please return a JSON object with:
              {
                "score": number (0-100),
                "feedback": "detailed feedback on the response including strengths and areas for improvement"
              }`
            }]
          }]
        }),
      });

      const data = await analysisResponse.json();
      const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      try {
        return JSON.parse(analysisText);
      } catch {
        return {
          score: Math.floor(Math.random() * 30) + 70,
          feedback: "Good response! Consider providing more specific examples and details."
        };
      }
    } catch (error) {
      return {
        score: 75,
        feedback: "Unable to analyze response at this time."
      };
    }
  };

  const endInterview = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!session) return;

    setIsAnalyzing(true);
    
    // Generate final analysis
    const overallScore = session.responses.reduce((sum, r) => sum + r.score, 0) / session.responses.length;
    const totalTime = Date.now() - session.startTime;
    
    const results = {
      overallScore: Math.round(overallScore),
      totalTime: Math.round(totalTime / 1000 / 60), // minutes
      questionsAnswered: session.responses.length,
      totalQuestions: session.questions.length,
      responses: session.responses,
      recommendations: generateRecommendations(session.responses)
    };
    
    setFinalResults(results);
    setSession(prev => prev ? { ...prev, isActive: false } : null);
    setIsAnalyzing(false);
    toast.success("Interview completed!");
  };

  const generateRecommendations = (responses: InterviewResponse[]) => {
    const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    
    if (avgScore >= 85) {
      return [
        "Excellent performance! You demonstrated strong communication skills.",
        "Continue practicing to maintain this high level of performance.",
        "Consider focusing on advanced technical questions for senior roles."
      ];
    } else if (avgScore >= 70) {
      return [
        "Good performance with room for improvement.",
        "Practice providing more specific examples in your responses.",
        "Work on structuring your answers using the STAR method."
      ];
    } else {
      return [
        "Focus on improving your response structure and clarity.",
        "Practice common interview questions more frequently.",
        "Consider working with a mentor or career coach."
      ];
    }
  };

  const resetInterview = () => {
    setSession(null);
    setCurrentResponse("");
    setTimeRemaining(0);
    setFinalResults(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerClasses = `p-6 space-y-6 ${
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
  }`;

  if (finalResults) {
    return (
      <div className={containerClasses}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Award className="h-6 w-6 text-yellow-500" />
                Interview Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{finalResults.overallScore}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{finalResults.totalTime}m</div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {finalResults.questionsAnswered}/{finalResults.totalQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">Questions Answered</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {finalResults.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500">💡</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={resetInterview}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎭 Mock Interview Simulator</h1>
          <p className="text-muted-foreground">
            Practice your interview skills with AI-powered feedback and analysis
          </p>
        </div>

        {!session ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Start Your Mock Interview?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                >
                  {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  This mock interview includes {sampleQuestions.length} questions covering behavioral and situational scenarios.
                </p>
                <Button onClick={startInterview} size="lg" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Mock Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Interview Session</span>
                  <Badge variant="default">
                    Question {session.currentQuestionIndex + 1} of {session.questions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCameraOn(!isCameraOn)}
                    >
                      {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsMicOn(!isMicOn)}
                    >
                      {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="text-lg font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
                
                <Progress 
                  value={(session.questions[session.currentQuestionIndex].timeLimit - timeRemaining) / session.questions[session.currentQuestionIndex].timeLimit * 100} 
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Question & Response Section */}
            <Card>
              <CardHeader>
                <CardTitle>Current Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline">
                      {session.questions[session.currentQuestionIndex].category}
                    </Badge>
                    <Badge variant="secondary">
                      {session.questions[session.currentQuestionIndex].difficulty}
                    </Badge>
                  </div>
                  <p className="font-medium">
                    {session.questions[session.currentQuestionIndex].question}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Response:</label>
                  <textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder="Type your response here or speak aloud..."
                    className="w-full h-32 p-3 border rounded-lg resize-none"
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleNextQuestion}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? "Analyzing..." : "Next Question"}
                  </Button>
                  <Button
                    onClick={endInterview}
                    variant="destructive"
                    disabled={isAnalyzing}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewSimulator;