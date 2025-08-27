"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Target, Brain, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

const GEMINI_API_KEY = "AIzaSyAjWxQEVa72lu4gFuMUGbaxzgVmHMsRSGI";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface PerformanceMetric {
  category: string;
  score: number;
  improvement: number;
  feedback: string;
}

interface InterviewSession {
  id: string;
  date: string;
  duration: number;
  overallScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  categories: PerformanceMetric[];
}

interface AnalyticsData {
  sessions: InterviewSession[];
  overallProgress: {
    averageScore: number;
    totalSessions: number;
    totalHours: number;
    improvementRate: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const InterviewAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("month");

  // Sample data - in a real app, this would come from your database
  const sampleSessions: InterviewSession[] = [
    {
      id: "1",
      date: "2024-01-15",
      duration: 45,
      overallScore: 78,
      questionsAnswered: 8,
      totalQuestions: 10,
      categories: [
        { category: "Technical", score: 82, improvement: 5, feedback: "Strong technical knowledge" },
        { category: "Behavioral", score: 75, improvement: -2, feedback: "Good examples, could be more specific" },
        { category: "Communication", score: 80, improvement: 8, feedback: "Clear and articulate responses" }
      ]
    },
    {
      id: "2",
      date: "2024-01-10",
      duration: 38,
      overallScore: 72,
      questionsAnswered: 7,
      totalQuestions: 10,
      categories: [
        { category: "Technical", score: 77, improvement: 3, feedback: "Solid foundation, room for growth" },
        { category: "Behavioral", score: 77, improvement: 4, feedback: "Good storytelling approach" },
        { category: "Communication", score: 72, improvement: 2, feedback: "Sometimes unclear, practice needed" }
      ]
    },
    {
      id: "3",
      date: "2024-01-05",
      duration: 42,
      overallScore: 69,
      questionsAnswered: 9,
      totalQuestions: 10,
      categories: [
        { category: "Technical", score: 74, improvement: 0, feedback: "Basic understanding demonstrated" },
        { category: "Behavioral", score: 73, improvement: 1, feedback: "Relevant examples provided" },
        { category: "Communication", score: 70, improvement: -1, feedback: "Needs more confidence" }
      ]
    }
  ];

  useEffect(() => {
    generateAnalytics();
  }, [selectedTimeframe]);

  const generateAnalytics = async () => {
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filteredSessions = filterSessionsByTimeframe(sampleSessions, selectedTimeframe);
      
      const overallProgress = {
        averageScore: Math.round(filteredSessions.reduce((sum, s) => sum + s.overallScore, 0) / filteredSessions.length),
        totalSessions: filteredSessions.length,
        totalHours: Math.round(filteredSessions.reduce((sum, s) => sum + s.duration, 0) / 60 * 10) / 10,
        improvementRate: calculateImprovementRate(filteredSessions)
      };

      // Generate AI insights
      const insights = await generateAIInsights(filteredSessions);
      
      setAnalyticsData({
        sessions: filteredSessions,
        overallProgress,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses,
        recommendations: insights.recommendations
      });
      
    } catch (error) {
      console.error("Error generating analytics:", error);
      toast.error("Failed to generate analytics");
    } finally {
      setLoading(false);
    }
  };

  const filterSessionsByTimeframe = (sessions: InterviewSession[], timeframe: string) => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return sessions;
    }
    
    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  };

  const calculateImprovementRate = (sessions: InterviewSession[]) => {
    if (sessions.length < 2) return 0;
    
    const sortedSessions = sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstScore = sortedSessions[0].overallScore;
    const lastScore = sortedSessions[sortedSessions.length - 1].overallScore;
    
    return Math.round(((lastScore - firstScore) / firstScore) * 100);
  };

  const generateAIInsights = async (sessions: InterviewSession[]) => {
    try {
      const sessionData = JSON.stringify(sessions);
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze these interview performance sessions and provide insights in JSON format:
              
              Sessions: ${sessionData}
              
              Please return a JSON object with:
              {
                "strengths": ["strength1", "strength2", "strength3"],
                "weaknesses": ["weakness1", "weakness2", "weakness3"],
                "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
              }
              
              Focus on patterns in performance, areas of improvement, and actionable recommendations.`
            }]
          }]
        }),
      });

      const data = await response.json();
      const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      try {
        return JSON.parse(analysisText);
      } catch {
        return {
          strengths: ["Consistent performance", "Good technical knowledge", "Clear communication"],
          weaknesses: ["Time management", "Specific examples needed", "Confidence building"],
          recommendations: [
            "Practice more behavioral questions with STAR method",
            "Work on providing specific, quantifiable examples",
            "Focus on time management during responses",
            "Practice mock interviews regularly",
            "Develop stronger closing statements"
          ]
        };
      }
    } catch (error) {
      return {
        strengths: ["Consistent performance", "Good technical knowledge"],
        weaknesses: ["Time management", "Specific examples needed"],
        recommendations: ["Practice more mock interviews", "Work on specific examples"]
      };
    }
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      ...analyticsData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-analytics-${selectedTimeframe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Analytics exported successfully!");
  };

  const containerClasses = `p-6 space-y-6 ${
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
  }`;

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Interview Performance Analytics</h1>
            <p className="text-muted-foreground">
              Track your progress and get AI-powered insights to improve your interview skills
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {["week", "month", "all"].map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe as any)}
                >
                  {timeframe === "all" ? "All Time" : `Last ${timeframe}`}
                </Button>
              ))}
            </div>
            
            <Button onClick={exportAnalytics} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {analyticsData.overallProgress.averageScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {analyticsData.overallProgress.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {analyticsData.overallProgress.totalHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Practice Time</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    analyticsData.overallProgress.improvementRate >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {analyticsData.overallProgress.improvementRate > 0 ? "+" : ""}{analyticsData.overallProgress.improvementRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Improvement</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.sessions.map((session, index) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">Session {analyticsData.sessions.length - index}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString()} • {session.duration}min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{session.overallScore}%</div>
                          <div className="text-sm text-muted-foreground">
                            {session.questionsAnswered}/{session.totalQuestions} questions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Technical", "Behavioral", "Communication"].map((category) => {
                      const categoryScores = analyticsData.sessions.flatMap(s => 
                        s.categories.filter(c => c.category === category).map(c => c.score)
                      );
                      const avgScore = Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{category}</span>
                            <span className="text-sm font-bold">{avgScore}%</span>
                          </div>
                          <Progress value={avgScore} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Target className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analyticsData.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <TrendingUp className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analyticsData.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-yellow-500 mt-0.5">⚠</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Brain className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <ul className="space-y-2">
                      {analyticsData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-500 mt-0.5">💡</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewAnalytics;