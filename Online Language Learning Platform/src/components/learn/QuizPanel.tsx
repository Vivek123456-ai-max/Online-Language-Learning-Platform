import React, { useState } from 'react';
import { Quiz, QuizQuestion } from '../../types/database';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, HelpCircle, Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface QuizPanelProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onQuizCompleted?: (scorePercent: number, passed: boolean) => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  quiz,
  questions,
  onQuizCompleted,
}) => {
  const { user, refreshProfile } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number>(0);

  const handleSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setIsSubmitting(true);
    let correctCount = 0;

    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correct = q.correct_answers?.[0];
      if (selected && correct && selected === correct) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const passed = percent >= (quiz.passing_score_percent || 70);
    setScore(percent);
    setIsSubmitted(true);

    // Save attempt to database if logged in
    if (user) {
      try {
        await supabase.from('quiz_attempts').insert({
          quiz_id: quiz.id,
          user_id: user.id,
          score_percent: percent,
          passed: passed,
          answers: selectedAnswers,
        });

        if (passed) {
          // Award XP
          const xp = 20;
          await supabase.from('learning_activity').insert({
            user_id: user.id,
            activity_type: 'quiz_passed',
            xp_earned: xp,
            reference_id: quiz.id,
            metadata: { quiz_title: quiz.title, score: percent },
          });

          const { data: stats } = await supabase
            .from('user_stats')
            .select('xp, quizzes_passed')
            .eq('user_id', user.id)
            .maybeSingle();

          if (stats) {
            await supabase
              .from('user_stats')
              .update({
                xp: (stats.xp || 0) + xp,
                quizzes_passed: (stats.quizzes_passed || 0) + 1,
              })
              .eq('user_id', user.id);
          }

          await refreshProfile();
        }
      } catch (err) {
        console.error('Quiz submission error:', err);
      }
    }

    setIsSubmitting(false);
    if (onQuizCompleted) {
      onQuizCompleted(percent, passed);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  const passed = score >= (quiz.passing_score_percent || 70);

  return (
    <div className="bg-[#101522] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
            Knowledge Check
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{quiz.title}</h2>
          {quiz.description && <p className="text-xs text-slate-400 mt-1">{quiz.description}</p>}
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Passing score:</span>
          <span className="text-sm font-mono font-bold text-white block">{quiz.passing_score_percent}%</span>
        </div>
      </div>

      {/* Result summary banner */}
      {isSubmitted && (
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {passed ? <Trophy className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-rose-400" />}
            <div>
              <h3 className="font-bold text-white text-base">
                {passed ? 'Quiz Passed! 🎉' : 'Needs Practice'}
              </h3>
              <p className="text-xs text-slate-300">
                You scored <strong className="font-mono text-white">{score}%</strong> (required:{' '}
                {quiz.passing_score_percent}%). {passed ? '+20 XP earned!' : 'Review the concepts and try again.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetake} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Try Again
          </Button>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const selected = selectedAnswers[q.id];
          const isCorrect = isSubmitted && selected === q.correct_answers?.[0];
          const isWrong = isSubmitted && selected && selected !== q.correct_answers?.[0];

          return (
            <div
              key={q.id}
              className={`p-5 rounded-xl border transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isWrong
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-[#0d111b] border-slate-800'
                  : 'bg-[#0d111b] border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {qIndex + 1}
                </span>
                <div className="space-y-3 flex-1">
                  <h4 className="text-sm font-semibold text-white leading-relaxed">{q.question_text}</h4>

                  {q.code_snippet && (
                    <pre className="p-3 bg-[#080b11] rounded-lg text-xs font-mono text-indigo-300 border border-slate-800 overflow-x-auto">
                      {q.code_snippet}
                    </pre>
                  )}

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options?.map((opt) => {
                      const isOptionSelected = selected === opt.id;
                      const isOptionAnswer = isSubmitted && q.correct_answers?.includes(opt.id);

                      let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700';

                      if (isSubmitted) {
                        if (isOptionAnswer) {
                          optionStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold';
                        } else if (isOptionSelected && !isOptionAnswer) {
                          optionStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300';
                        }
                      } else if (isOptionSelected) {
                        optionStyle = 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-inner';
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isSubmitted}
                          onClick={() => handleSelect(q.id, opt.id)}
                          className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${optionStyle}`}
                        >
                          <span>{opt.text}</span>
                          {isSubmitted && isOptionAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {isSubmitted && isOptionSelected && !isOptionAnswer && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation when submitted */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2 mt-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200">Explanation: </strong>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={Object.keys(selectedAnswers).length === 0}
          >
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
};
