export type InterviewQuestionInput = {
  jobRole: string;
  category: string;
  difficulty: string;
  company?: string;
};

export const generateInterviewQuestion = (input: InterviewQuestionInput) => {
  void input;

  return {
    question: "Tell me about yourself."
  };
};
