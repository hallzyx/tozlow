Necesito que me crees una Dapp usando abritrum stylus para smart contracts en cual trate de 
que uno de los participantes cree una "sesion" la cual representa por ejm "Una reunión por el cumpleaños de Pedro", y que en esta sesion acuerde cuanto de dinero cada usuario acordará poner [por ejm: 1 usdc], dicho usuario pone el monto, además tambien se agrega una fecha en especifico de vencimiento [que suele ser la hora y fecha de dicho encuentro de amigos, fiesta, etc...]
Pueden admitirse desde 3 a 5 participantes en una "sesion" [de momento]
Estos participantes reciben la sesion y entran en la misma, al depositar dicho monto tambien.
Llegado el momento de que se cumpla la fecha, estos deberan votar para ver quien de los 3 a faltado. Si por ejemplo, todos coinciden en que 1 a faltado, [digamos paricipante C a faltado, parcipante A y B indicaron que C a faltado, coincidieron].
Si pasa eso, el dinero del que [o los que faltaron] se reparten entre los que si asitieron.

Esta Dapp busca poder usar los contratos inteligentes en caso habituales como los encuentros de amigos para penalizar a quien dice que va, pero falta a la reunion.

Nota:

Usar USDC como saldo a depositar en las sesiones.

En el header de cada address que se loguee, motras el saldo en usdc y en sepolia [de la red de arbitrum, toda la Dapp vivirá en arbitrum testnet]

Usar 
- La skill "arbitrum-dapp-skill" para la implementacion de la Dapp
- el mcp de open zeppelin para smart contracts de stylus

Puedes usar los demás skills y mcps que se tiene de ser necesario segun tu lo creas conveniente.
