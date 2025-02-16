// digital-seva\app\faq.tsx
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  { 
    question: "How do I register for an account on the platform?", 
    answer: "To register for an account, click on the 'Register' button on the homepage. Fill in your personal details such as name, email, phone number, age, and gender. Once you submit the form, you will receive a confirmation email. Follow the instructions in the email to complete your registration."
  },
  { 
    question: "How can I upload and verify my documents?", 
    answer: "After logging in, navigate to the 'Document Management System' section. Click on 'Upload Documents' and select the type of document you want to upload. Follow the instructions to scan or upload the document. The system will automatically verify the document using our AI-powered verification process."
  },
  { 
    question: "What types of government schemes can I find on this platform?", 
    answer: "Our platform provides information on a wide range of government schemes, including those related to agriculture, healthcare, housing, education, employment, insurance, and welfare. You can use the 'Scheme Finder' to search and filter schemes based on your eligibility and preferences."
  },
  { 
    question: "How does the AI assistant help me with government schemes?", 
    answer: "The AI assistant, Nithya, helps you by providing personalized recommendations based on your profile. You can ask Nithya about scheme eligibility, required documents, application processes, and benefits. Nithya can also guide you through the application steps and provide updates on your application status."
  },
  { 
    question: " How does the AI Scheme Recommender work?", 
    answer: "The AI Scheme Recommender analyzes your profile details, such as age, income, occupation, location, and other relevant factors. It then matches your profile with the eligibility criteria of various government schemes to provide you with a list of schemes you are eligible for. This personalized recommendation helps you easily find and apply for the schemes that best suit your needs."
  }
];

const FAQSection = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-16 px-6">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Find answers to common questions about our platform- Digital Seva.
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqData.map((item, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border rounded-lg px-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <AccordionTrigger className="text-left text-base font-medium py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-300 pb-4 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export default FAQSection
