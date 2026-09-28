"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  CONVIVENCIA_QUESTIONS,
  findConvivenciaOption,
  isConvivenciaComplete,
  readConvivenciaDraft,
  saveConvivenciaDraft,
  type ConvivenciaAnswers,
  type ConvivenciaQuestionId,
} from "@/lib/convivenciaTest";
import s from "./ConvivenciaTest.module.css";

const REGISTER_URL = "/register?utm_source=esn_malaga&utm_medium=partner&utm_campaign=erasmus_2026";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ConvivenciaTest() {
  const [answers, setAnswers] = useState<ConvivenciaAnswers>({});

  // El borrador se lee despues del montaje, no en el useState inicial:
  // localStorage no existe en el servidor y leerlo en el primer render
  // haria que el HTML del servidor y el del cliente no coincidan.
  useEffect(() => {
    const saved = readConvivenciaDraft();
    if (Object.keys(saved).length === 0) return;

    const frame = window.requestAnimationFrame(() => setAnswers(saved));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function choose(id: ConvivenciaQuestionId, value: string) {
    setAnswers((previous) => {
      const next = { ...previous, [id]: value };
      saveConvivenciaDraft(next);
      return next;
    });
  }

  const complete = isConvivenciaComplete(answers);

  return (
    <section className={s.section} id="convivencia" aria-labelledby="convivencia-title">
      <div className={s.head}>
        <span className="kicker">Tu perfil, en tres respuestas</span>
        <h2 id="convivencia-title">¿Cómo te imaginas tu convivencia?</h2>
        <p>
          Nadie elige con quién vive por una foto. Responde tres preguntas y mira
          cómo empieza a tomar forma tu perfil.
        </p>
      </div>

      <div className={s.grid}>
        <div className={s.questions}>
          {CONVIVENCIA_QUESTIONS.map((question) => (
            <fieldset className={s.question} key={question.id}>
              <legend>{question.legend}</legend>
              <div className={s.options}>
                {question.options.map((option) => {
                  const id = `convivencia-${question.id}-${option.value}`;
                  return (
                    <div key={option.value}>
                      <input
                        type="radio"
                        id={id}
                        name={`convivencia-${question.id}`}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        onChange={() => choose(question.id, option.value)}
                      />
                      <label htmlFor={id}>{option.label}</label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className={s.cardWrap}>
          {/* aria-live: quien navega con lector de pantalla oye como cambia
              la tarjeta al responder, sin tener que ir a buscarla. */}
          <div className={s.card} aria-live="polite">
            <div className={s.cardHead}>
              <span className={s.cardAvatar} aria-hidden="true">
                Tú
              </span>
              <span>Tu perfil CoFlow</span>
            </div>

            <dl className={s.rows}>
              {CONVIVENCIA_QUESTIONS.map((question) => {
                const option = findConvivenciaOption(question, answers);
                return (
                  <div className={s.row} key={question.id}>
                    <dt>{question.shortLabel}</dt>
                    {option ? (
                      // La key hace que React remonte el <dd> al cambiar de
                      // respuesta, y con ello se repite la animacion de entrada.
                      <dd key={option.value}>
                        <span className={s.value}>{option.cardLabel}</span>
                      </dd>
                    ) : (
                      <dd className={s.pending}>—</dd>
                    )}
                  </div>
                );
              })}
            </dl>

            {complete && (
              <div className={s.done}>
                <p>Este es solo el principio de tu perfil CoFlow.</p>
                <Link className={s.cta} href={REGISTER_URL}>
                  Encontrar personas compatibles <ArrowIcon />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
