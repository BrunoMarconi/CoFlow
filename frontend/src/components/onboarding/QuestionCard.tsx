interface QuestionCardProps {
  category: string;
  title: string;
  description: string;
}

export default function QuestionCard({ category, title, description }: QuestionCardProps) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
        {category}
      </p>
      <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-brand-dark md:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-secondary md:text-lg">
        {description}
      </p>
    </div>
  );
}
