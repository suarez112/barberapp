// En desarrollo se puede completar una cita antes de su hora para probar.
// En las compilaciones de producción (__DEV__ = false) la regla se aplica.
export const MODO_PRUEBAS = __DEV__;

// Si una cita se marca completada más de este tiempo después de su hora,
// el administrador ve una advertencia.
export const MINUTOS_ALERTA_COMPLETADA_TARDE = 120;
