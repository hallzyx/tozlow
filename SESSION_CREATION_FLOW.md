# Flujo de Creación de Sesiones en Tozlow 🎉

## Resumen Ejecutivo

Tozlow es una dApp que permite crear **sesiones de responsabilidad grupal** donde los participantes depositan USDC como garantía de asistencia a eventos acordados. Si alguien falta, pierde su depósito que se reparte entre los presentes.

## Flujo Completo de Creación de Sesión

### 1. Conexión de Wallet
**Paso inicial obligatorio**

- El usuario debe conectar su wallet usando el botón "Conectar wallet" en el header
- Aparece un modal con opciones:
  - **Injected**: Para wallets como MetaMask, OKX, etc.
  - **WalletConnect**: Para conexión vía QR code
- Si la wallet no está en **Arbitrum Sepolia**, aparece un mensaje "Cambiar a Arbitrum Sepolia" con botón para cambiar automáticamente

**Validaciones:**
- Wallet debe estar conectada
- Debe estar en la red correcta (Arbitrum Sepolia)

### 2. Acceso al Modal de Creación
**Ubicación:** Botón "Nueva sesión" en la página principal

- Se encuentra en la sección principal de la app
- Solo visible cuando la wallet está conectada y en la red correcta

### 3. Configuración de la Sesión

#### 3.1 Monto por Participante
**Campo obligatorio**
- **Tipo:** Número decimal (USDC tiene 6 decimales)
- **Valor mínimo:** 0.01 USDC
- **Valor por defecto:** 1.00 USDC
- **Formato:** Input numérico con step 0.01

**Consideraciones:**
- Este monto será depositado por cada participante
- Si alguien falta, pierde este monto
- El monto se reparte entre los asistentes

#### 3.2 Fecha y Hora Límite
**Campo obligatorio**
- **Fecha:** Input de tipo `date` (YYYY-MM-DD)
- **Hora:** Input de tipo `time` (HH:MM)
- **Formato interno:** Timestamp Unix (segundos)

**Validaciones:**
- La fecha/hora debe ser en el futuro
- No se permiten fechas pasadas

#### 3.3 Participantes
**Campo obligatorio**
- **Mínimo:** 3 participantes totales (host + 2 amigos)
- **Máximo:** 5 participantes totales (host + 4 amigos)
- **Formato:** Direcciones Ethereum (`0x...`)

**Estructura:**
- El **host** (creador) se agrega automáticamente
- Campos para agregar wallets de amigos (2-4 campos)
- Cada participante debe tener una dirección válida

**Interfaz:**
- Campo de texto para cada participante
- Botón "+" para agregar participante
- Botón "🗑️" para remover participante
- Indicador visual del host

### 4. Envío de la Transacción
**Acción:** Botón "Crear sesión"

**Parámetros enviados al contrato:**
```solidity
createSession(
    uint256 amountPerPerson,    // Monto en USDC (6 decimales)
    uint256 deadline,           // Timestamp Unix
    address[] participants      // Array de direcciones
)
```

**Estados durante el envío:**
1. **Pendiente:** `isPending = true` → Muestra spinner
2. **Confirmando:** `isConfirming = true` → Espera confirmación en blockchain
3. **Éxito:** `isSuccess = true` → Modal se cierra, callback `onSuccess`

### 5. Post-Creación

#### 5.1 Actualización de la UI
- El modal se cierra automáticamente
- Se actualiza la lista de sesiones en la página principal
- La nueva sesión aparece con ID único

#### 5.2 Estado de la Sesión
**Información almacenada:**
- **ID de sesión:** `uint256` (autoincremental)
- **Host:** Dirección del creador
- **Monto por persona:** En wei de USDC
- **Deadline:** Timestamp Unix
- **Participantes:** Array de direcciones
- **Estado:** `active = true`, `finalized = false`

#### 5.3 Próximos Pasos para Participantes
Una vez creada la sesión, los participantes pueden:

1. **Depositar USDC** → Llamar `deposit(sessionId)`
2. **Ver estado** → Consultar `getSession(sessionId)`
3. **Votar ausencias** → Después del deadline, llamar `castVote(sessionId, absent)`
4. **Finalizar** → El host puede llamar `finalizeSession(sessionId)`

## Estados de Error

### Errores de Validación
- **"Conecta tu wallet primero"**: Wallet no conectada
- **"Necesitas al menos 2 amigos más (3 total)"**: Menos de 3 participantes
- **"La fecha tiene que ser en el futuro"**: Fecha/hora inválida o pasada

### Errores de Contrato
- **Reversiones del contrato**: Se parsean y muestran mensajes amigables
- **Errores de red**: Problemas de conexión con Arbitrum Sepolia

## Interfaz de Usuario

### Diseño del Modal
- **Estilo:** Glass morphism con backdrop blur
- **Animaciones:** `animate-slide-up` al abrir
- **Responsive:** `max-w-lg` centrado
- **Tema:** Colores CSS variables personalizadas

### Campos del Formulario
- **Labels con iconos:** Coins, Calendar, Users
- **Estados de foco:** Bordes coloreados por campo
- **Validación visual:** Mensajes de error en rojo
- **Estados de carga:** Spinners durante transacciones

### Feedback Visual
- **Éxito:** Modal se cierra automáticamente
- **Error:** Mensaje rojo debajo del formulario
- **Carga:** Botón deshabilitado con spinner

## Consideraciones Técnicas

### Smart Contract Integration
- **ABI:** `tozlowAbi` importado desde `@/abi/TozlowSession`
- **Address:** `TOZLOW_ADDRESS` desde variables de entorno
- **Hooks:** `useWriteContract` + `useWaitForTransactionReceipt`

### Gestión de Estado
- **Local state:** `useState` para campos del formulario
- **Error handling:** `parseContractError` para errores legibles
- **Success callback:** Actualiza lista de sesiones padre

### Validaciones Frontend
- **Tipo checking:** TypeScript para direcciones `0x${string}[]`
- **Formato numérico:** `parseUnits(amount, 6)` para USDC
- **Timestamp:** Conversión manual de fecha/hora local

## Flujo de Participantes

### Para unirse a una sesión existente:
1. Ver sesiones activas en la página principal
2. Hacer clic en una sesión
3. Ver detalles y participantes
4. Depositar USDC si es participante
5. Esperar al deadline
6. Votar por ausencias
7. Reclamar recompensas si corresponde

### Estados posibles de una sesión:
- **Activa:** Recolectando depósitos
- **Finalizada:** Votación completada, fondos distribuidos
- **Expirada:** Deadline pasado, esperando finalización

## Conclusión

El flujo de creación de sesiones en Tozlow está diseñado para ser **intuitivo y seguro**, con múltiples validaciones tanto en frontend como en smart contract. La interfaz guía al usuario paso a paso, asegurando que todas las condiciones necesarias se cumplan antes de crear una sesión vinculante en blockchain.