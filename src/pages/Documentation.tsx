// [CMP-060d51] Documentation — in-app documentation page
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, Download, ChevronRight, Book, HelpCircle, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const documentCategories = [
  {
    id: "getting-started",
    title: "Getting Started Guides",
    icon: Book,
    color: "text-blue-600",
    documents: [
      { id: "1", title: "Agent Onboarding Guide", type: "PDF", size: "2.3 MB" },
      { id: "2", title: "Mobile App Basics", type: "PDF", size: "1.8 MB" },
      { id: "3", title: "First Day Checklist", type: "PDF", size: "0.5 MB" }
    ]
  },
  {
    id: "how-to",
    title: "How-To Guides", 
    icon: HelpCircle,
    color: "text-green-600",
    documents: [
      { id: "4", title: "How to Conduct a Survey", type: "PDF", size: "3.1 MB" },
      { id: "5", title: "Recording Best Practices", type: "PDF", size: "2.7 MB" },
      { id: "6", title: "Customer Interaction Guidelines", type: "PDF", size: "1.9 MB" },
      { id: "7", title: "Troubleshooting Guide", type: "PDF", size: "4.2 MB" }
    ]
  },
  {
    id: "products",
    title: "Product Catalogs",
    icon: Briefcase,
    color: "text-purple-600", 
    documents: [
      { id: "8", title: "Solar Panel Specifications", type: "PDF", size: "5.6 MB" },
      { id: "9", title: "LED Product Catalog", type: "PDF", size: "8.1 MB" },
      { id: "10", title: "Pricing Guide 2024", type: "PDF", size: "1.2 MB" }
    ]
  }
];

const faqs = [
  {
    id: "1",
    question: "How do I start a new survey?",
    answer: "Navigate to the Surveys page and tap 'Start Survey'. Select your survey template and begin."
  },
  {
    id: "2",
    question: "What if I can't record audio?",
    answer: "Check your microphone permissions in Settings. If issues persist, contact support."
  },
  {
    id: "3",
    question: "How are points calculated?",
    answer: "Points are awarded based on activity type: Sales (25pts), Surveys (15pts), Giveaways (8pts), Interactions (10pts)."
  }
];

export const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFAQs, setShowFAQs] = useState(false);

  const filteredCategories = documentCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.documents.some(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (selectedCategory) {
    const category = documentCategories.find(cat => cat.id === selectedCategory);
    if (category) {
      return (
        <MobileLayout currentPage="more">
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCategory(null)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-h1">{category.title}</h1>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {category.documents.map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-black">{doc.title}</h3>
                        <p className="text-sm text-gray-600">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Download size={20} />
                      </Button>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </MobileLayout>
      );
    }
  }

  if (showFAQs) {
    return (
      <MobileLayout currentPage="more">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFAQs(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-h1">Frequently Asked Questions</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="p-4">
                <h3 className="font-medium text-black mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Documentation</h1>
        </div>
        
        <p className="text-sm opacity-90">Access guides, resources, and support materials</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      <div>
                        <h3 className="font-medium text-black">{category.title}</h3>
                        <p className="text-sm text-gray-600">
                          {category.documents.length} documents
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* FAQs */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowFAQs(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-black">FAQs</h3>
                    <p className="text-sm text-gray-600">
                      Frequently asked questions
                    </p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {faqs.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};