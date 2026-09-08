"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import { Camera, ChevronLeft, ChevronRight, Grip, ImageIcon, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { UserPhoto } from "@/types/userPhoto";

const MAX_PHOTOS = 9;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePhotosManager({ photos, onUpload, onDelete, onReorder }: {
  photos: UserPhoto[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (photoId: number) => Promise<void>;
  onReorder: (photoIds: number[]) => Promise<void>;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null);
  /* Foto pendiente de confirmar el borrado. Sustituye al window.confirm
   * que había aquí: un diálogo nativo congela la pestaña, no se puede
   * cancelar arrastrando y —lo importante en un borrado— no enseña QUÉ
   * foto vas a perder. El sheet la muestra. */
  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto | null>(null);
  const [pendingUploads, setPendingUploads] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [error, setError] = useState("");

  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const mainPhoto = sorted[0] ?? null;
  const remaining = Math.max(MAX_PHOTOS - sorted.length, 0);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    if (files.length > remaining) {
      setError(`Puedes añadir ${remaining === 1 ? "una foto más" : `${remaining} fotos más`} como máximo.`);
      resetInputs();
      return;
    }
    if (files.some((file) => !ACCEPTED_TYPES.includes(file.type))) {
      setError("Solo se aceptan imágenes JPEG, PNG o WebP.");
      resetInputs();
      return;
    }

    setError("");
    setUploading(true);
    setShowSourceSheet(false);

    // Miniaturas locales al instante: la foto se ve en su sitio desde el
    // primer momento en vez de un "Subiendo fotos..." sin nada que mirar.
    // No se inventa un porcentaje porque onUpload no informa del avance;
    // mostrar una barra falsa sería peor que no mostrarla.
    const previews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      url: URL.createObjectURL(file),
    }));
    setPendingUploads(previews);

    try {
      await onUpload(files);
    } catch (uploadError) {
      setError(getCommunityErrorMessage(uploadError, "No pudimos subir las fotos. Inténtalo de nuevo."));
    } finally {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
      setPendingUploads([]);
      setUploading(false);
      resetInputs();
    }
  }

  function resetInputs() {
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function removePhoto(photo: UserPhoto) {
    if (busyPhotoId !== null) return;
    setPhotoToDelete(photo);
  }

  async function confirmRemovePhoto() {
    const photo = photoToDelete;
    if (!photo) return;

    setBusyPhotoId(photo.id);
    setError("");
    try {
      await onDelete(photo.id);
      setPhotoToDelete(null);
    } catch {
      setError("No pudimos eliminar la foto.");
      setPhotoToDelete(null);
    } finally {
      setBusyPhotoId(null);
    }
  }

  /* Al soltar se mira qué foto hay bajo el dedo. Es más fiable que
   * calcular la celda a partir del desplazamiento: la cuadrícula cambia
   * de columnas con el ancho y las filas no son todas iguales.
   *
   * Se usan las coordenadas del evento nativo (de viewport) y no
   * `info.point`, que framer da relativo al documento y obligaría a
   * corregir el scroll a mano. */
  function handleDragEnd(
    photoId: number,
    event: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } }
  ) {

    const point =
      "clientX" in event
        ? { x: event.clientX, y: event.clientY }
        : event.changedTouches?.[0]
          ? {
              x: event.changedTouches[0].clientX,
              y: event.changedTouches[0].clientY,
            }
          : { x: info.point.x - window.scrollX, y: info.point.y - window.scrollY };

    // La foto que se arrastra queda justo debajo del dedo y taparía al
    // destino, así que se recorren todas las capas del punto y se
    // descarta la propia.
    const dropTarget = document
      .elementsFromPoint(point.x, point.y)
      .map((element) => element.closest<HTMLElement>("[data-photo-index]"))
      .find(
        (element): element is HTMLElement =>
          Boolean(element) && element!.dataset.photoId !== String(photoId)
      );

    if (!dropTarget) return;

    const targetIndex = Number(dropTarget.dataset.photoIndex);
    if (Number.isNaN(targetIndex)) return;

    void movePhoto(photoId, targetIndex);
  }

  async function movePhoto(photoId: number, targetIndex: number) {
    const currentIndex = sorted.findIndex((photo) => photo.id === photoId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length || currentIndex === targetIndex || busyPhotoId !== null) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setBusyPhotoId(photoId);
    setError("");
    try {
      await onReorder(reordered.map((photo) => photo.id));
    } catch {
      setError("No pudimos reordenar las fotos.");
    } finally {
      setBusyPhotoId(null);
    }
  }

  return (
    <>
      <input ref={galleryInputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple className="sr-only" onChange={(event) => handleFiles(event.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="sr-only" onChange={(event) => handleFiles(event.target.files)} />

      <section>
        <h2 className="text-base font-extrabold text-foreground sm:text-lg">Foto principal</h2>
        <p className="mt-1 text-sm text-secondary">Es la primera foto que verán los demás.</p>

        {mainPhoto ? (
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-24 border border-border bg-surface shadow-soft sm:aspect-[16/9]">
            <Image src={mainPhoto.image_url} alt="Foto principal del perfil" fill unoptimized priority sizes="(min-width: 640px) 768px, 100vw" className="object-cover" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-soft">
              <ShieldCheck className="h-4 w-4 text-primary" /> Principal
            </span>
            <button type="button" onClick={() => setShowSourceSheet(true)} aria-label="Añadir o cambiar foto" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-button">
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <span className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white">
              <Grip className="h-4 w-4" /> Reordena las fotos de abajo
            </span>
          </div>
        ) : (
          <button type="button" onClick={() => setShowSourceSheet(true)} className="mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center rounded-24 border border-dashed border-border bg-surface text-center shadow-soft sm:aspect-[16/9]">
            <ImageIcon className="h-9 w-9 text-primary" strokeWidth={1.6} />
            <span className="mt-3 text-sm font-bold text-foreground">Añade tu primera foto</span>
            <span className="mt-1 text-xs text-muted">JPEG, PNG o WebP</span>
          </button>
        )}
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground sm:text-lg">Tus fotos <span className="font-semibold text-secondary">({sorted.length}/{MAX_PHOTOS})</span></h2>
            <p className="mt-1 text-sm text-secondary">Añade fotos variadas y coloca primero la que más te represente.</p>
          </div>
          {remaining > 0 && <button type="button" onClick={() => setShowSourceSheet(true)} className="hidden h-10 shrink-0 items-center gap-2 rounded-12 border border-border bg-surface px-3 text-sm font-bold text-primary shadow-soft sm:flex"><Plus className="h-4 w-4" /> Añadir</button>}
        </div>

        {error && <p role="alert" className="mt-3 rounded-12 border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-soft">{error}</p>}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {sorted.map((photo, index) => (
            /* Arrastre con framer-motion y no con el `draggable` de HTML5:
               esa API es de escritorio y en táctil no dispara ningún
               evento, así que en el móvil el asa invitaba a un gesto que
               no hacía nada. framer usa eventos de puntero y funciona con
               el dedo igual que con el ratón. */
            <motion.article
              key={photo.id}
              layout
              transition={MOTION_SPRING.snappy}
              drag={busyPhotoId === null}
              dragSnapToOrigin
              dragElastic={0.16}
              whileDrag={{ scale: 1.08, zIndex: 30, boxShadow: "var(--shadow-modal)" }}
              onDragEnd={(event, info) => handleDragEnd(photo.id, event, info)}
              data-photo-index={index}
              data-photo-id={photo.id}
              style={{ touchAction: "none" }}
              className="group relative aspect-[3/4] cursor-grab overflow-hidden rounded-18 border border-border bg-surface shadow-soft active:cursor-grabbing"
            >
              <Image src={photo.image_url} alt={`Foto ${index + 1} del perfil`} fill unoptimized sizes="(min-width: 640px) 240px, 33vw" className="pointer-events-none object-cover" />
              <span className="absolute left-2 top-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/95 text-muted shadow-soft"><Grip className="h-4 w-4" /></span>
              <button type="button" disabled={busyPhotoId !== null} onClick={() => removePhoto(photo)} aria-label="Eliminar foto" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-soft transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
              <span className="absolute bottom-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/65 px-2 text-xs font-bold text-white">{index + 1}</span>
              {/* La primera es la portada del perfil: merece decirlo, es
                  el motivo real por el que alguien reordena. */}
              {index === 0 && (
                <span className="pointer-events-none absolute inset-x-2 bottom-2 mr-9 truncate rounded-full bg-primary px-2 py-1 text-3xs font-bold text-white">
                  Portada
                </span>
              )}
              <div className="absolute bottom-2 left-2 flex gap-1 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button type="button" disabled={index === 0 || busyPhotoId !== null} onClick={() => movePhoto(photo.id, index - 1)} aria-label="Mover foto antes" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-foreground shadow-soft disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" disabled={index === sorted.length - 1 || busyPhotoId !== null} onClick={() => movePhoto(photo.id, index + 1)} aria-label="Mover foto después" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-foreground shadow-soft disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            </motion.article>
          ))}

          {/* Las fotos que están subiendo ocupan ya su hueco en la
              cuadrícula: al terminar, la real las sustituye sin que nada
              se mueva de sitio. */}
          <AnimatePresence>
            {pendingUploads.map((preview) => (
              <motion.div
                key={preview.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={MOTION_SPRING.snappy}
                className="relative aspect-3/4 overflow-hidden rounded-18 border border-border bg-surface shadow-soft"
              >
                {/* Miniatura local, no pasa por next/image: es un blob
                    del dispositivo y no hay nada que optimizar. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt="Foto subiéndose"
                  className="h-full w-full object-cover opacity-45"
                />
                <motion.div
                  aria-hidden
                  animate={{ opacity: [0.35, 0.8, 0.35] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: MOTION_EASE.out }}
                  className="absolute inset-x-0 bottom-0 h-1 bg-primary"
                />
                <span className="absolute inset-0 flex items-end justify-center pb-3 text-3xs font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                  Subiendo…
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {remaining > 0 && (
            <button type="button" onClick={() => setShowSourceSheet(true)} disabled={uploading} className="flex aspect-3/4 flex-col items-center justify-center rounded-18 border border-dashed border-border bg-surface text-center shadow-soft disabled:opacity-60">
              <Plus className="h-7 w-7 text-primary" />
              <span className="mt-2 text-xs font-bold text-foreground sm:text-sm">Añadir foto</span>
            </button>
          )}
        </div>
      </section>

      <aside className="mt-7 rounded-18 border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><div><p className="text-sm font-extrabold text-foreground">Consejos para buenas fotos</p><ul className="mt-2 space-y-1 text-sm leading-6 text-secondary"><li>Muestra tu cara claramente y con buena luz.</li><li>Incluye situaciones y lugares diferentes.</li><li>Usa fotos naturales, sin filtros excesivos.</li></ul></div></div>
      </aside>

      <AnimatePresence>
        {showSourceSheet && (
          <BottomSheet onClose={() => setShowSourceSheet(false)} ariaLabel="Añadir foto" className="sm:max-w-md">
            <div className="px-5 pb-6 pt-3 sm:p-6">
              <h2 className="text-center text-xl font-extrabold text-foreground">Añadir foto</h2>
              <p className="mt-1 text-center text-sm text-secondary">Elige de dónde quieres añadirla</p>
              <div className="mt-5 divide-y divide-border rounded-18 border border-border bg-surface">
                <SourceButton icon={<Camera />} title="Cámara" description="Haz una foto ahora" onClick={() => cameraInputRef.current?.click()} />
                <SourceButton icon={<ImageIcon />} title="Galería o archivos" description="Elige una o varias imágenes" onClick={() => galleryInputRef.current?.click()} />
              </div>
              <button type="button" onClick={() => setShowSourceSheet(false)} className="mt-4 h-12 w-full rounded-14 border border-border bg-surface text-sm font-bold text-foreground shadow-soft">Cancelar</button>
            </div>
          </BottomSheet>
        )}

        {photoToDelete && (
          <ConfirmDialog
            key="delete-photo"
            title="¿Eliminar esta foto?"
            description="Desaparecerá de tu perfil y de cualquier sitio donde se esté mostrando. No se puede recuperar."
            confirmLabel="Eliminar"
            destructive
            pending={busyPhotoId !== null}
            onConfirm={() => void confirmRemovePhoto()}
            onClose={() => setPhotoToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SourceButton({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-soft"><span className="flex h-10 w-10 items-center justify-center text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-foreground">{title}</span><span className="mt-0.5 block text-xs text-secondary">{description}</span></span><ChevronRight className="h-4 w-4 text-muted" /></button>;
}
