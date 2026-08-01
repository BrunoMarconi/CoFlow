interface QuestionCardProps {
  category: string;
  title: string;
  description: string;
}

export default function QuestionCard({ category, title, description }: QuestionCardProps) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-green-600">
        {category}
      </p>
      <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#163B2E] md:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
        {description}
      </p>
    </div>
  );
}
