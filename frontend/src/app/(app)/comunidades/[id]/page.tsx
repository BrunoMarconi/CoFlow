"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import { useAuth } from "@/hooks/useAuth";

import CommunityHeader from "@/components/comunidad/CommunityHeader";
import CommunityOwnerActions from "@/components/comunidad/CommunityOwnerActions";
import Spinner from "@/components/ui/Spinner";

import {
  getCommunity,
  joinOpenCommunity,
} from "@/services/communities";

import type { Community } from "@/types/community";

export default function ComunidadDetallePage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading, refreshCommunity } = useAuth();

  const [community, setCommunity] =
    useState<Community | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setNotFound(false);
    setJoinError("");
    setJoinSuccess(false);

    getCommunity(params.id)
      .then((data) => {
        if (!active) return;

        setCommunity(data);
      })
      .catch(() => {
        if (!active) return;

        setNotFound(true);
        setCommunity(null);
      })
      .finally(() => {
        if (!active) return;

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleJoin() {
    if (
      !community ||
      joining ||
      community.is_member ||
      community.is_full
    ) {
      return;
    }

    setJoining(true);
    setJoinError("");
    setJoinSuccess(false);

    try {
      const updatedCommunity =
        await joinOpenCommunity(community.id);

      setCommunity(updatedCommunity);
      setJoinSuccess(true);
      await refreshCommunity();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        if (typeof detail === "string") {
          setJoinError(translateJoinError(detail));
          return;
        }
      }

      setJoinError(
        "No hemos podido unirte a la comunidad. Inténtalo de nuevo."
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !community) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-18 bg-mint-50 text-primary">
          <SearchIcon />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Comunidad no encontrada
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-dark">
          No hemos encontrado esta comunidad
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Puede que haya sido eliminada, desactivada o que el enlace ya no sea
          válido.
        </p>

        <Link
          href="/comunidades"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-18 bg-primary px-6 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Volver a comunidades
        </Link>
      </div>
    );
  }

  const isOwner =
    community.current_user_role === "OWNER" ||
    user?.id === community.owner_id;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/comunidades"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-brand-dark"
      >
        <ArrowLeftIcon />
        Volver a comunidades
      </Link>

      <CommunityHeader
        community={community}
        isOwner={isOwner}
        joining={joining}
        joinError={joinError}
        joinSuccess={joinSuccess}
        onJoin={handleJoin}
      />

      {isOwner && (
        <div className="mt-6">
          <CommunityOwnerActions
            community={community}
          />
        </div>
      )}
    </div>
  );
}

function translateJoinError(detail: string) {
  const errors: Record<string, string> = {
    "You already own this community":
      "Ya eres el administrador de esta comunidad.",

    "This community requires an application":
      "Esta comunidad requiere que envíes una solicitud.",

    "You are already a member of this community":
      "Ya perteneces a esta comunidad.",

    "You already belong to another active community":
      "Ya perteneces a otra comunidad activa.",

    "This community is full":
      "La comunidad ya ha alcanzado su capacidad máxima.",
  };

  return (
    errors[detail] ??
    "No hemos podido unirte a la comunidad."
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}