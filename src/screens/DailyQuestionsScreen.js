import { Share, View } from "react-native";

import QuestionCard from "../components/QuestionCard";
import ScreenTemplate from "./ScreenTemplate";
import { SPACING } from "../utils/constants";

const questions = [
  "Walk me through your resume.",
  "What is one technical concept you recently learned?",
  "Describe a time you handled feedback."
];

export default function DailyQuestionsScreen() {
  const shareQuestion = () =>
    Share.share({
      message: `Practice this interview question with PrepAI: ${questions[0]}`
    });

  return (
    <ScreenTemplate
      title="Daily questions"
      subtitle="Free users get a limited daily set. Premium unlocks unlimited practice."
      actions={[{ label: "Share question", onPress: shareQuestion }]}
    >
      <View style={{ gap: SPACING.md }}>
        {questions.map((question) => (
          <QuestionCard key={question} category="Daily" question={question} />
        ))}
      </View>
    </ScreenTemplate>
  );
}
