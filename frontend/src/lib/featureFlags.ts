// Interruptor temporal del Pasaporte de Solvencia (ver
// backend/app/core/config.py SOLVENCY_PASSPORT_ENABLED — mismo criterio,
// pero cada lado necesita su propia variable porque son procesos
// separados). Con "false", todos los puntos de entrada en la app se
// muestran atenuados con un badge "Próximamente" en vez de enlazar a la
// función real; el backend y las páginas siguen existiendo por si se
// reactiva más adelante, solo se oculta el acceso desde la UI.
// Activado directamente durante el desarrollo local del pasaporte.
// Cuando la función vaya a desplegarse, volveremos a conectarlo a una
// variable de entorno para controlar su publicación.
export const SOLVENCY_PASSPORT_ENABLED = true;
