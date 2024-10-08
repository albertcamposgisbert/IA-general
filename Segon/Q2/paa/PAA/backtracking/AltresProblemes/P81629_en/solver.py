coins = [0]*15
list_index_coins = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]

import sys

input = sys.stdin

euros, cents = input.readline().split()

money_to_return = float(euros) + float(cents)*0.01

def solver(money_to_return = money_to_return, actual_coin = 0):
    money_to_return = round(money_to_return, 2)
    if money_to_return == 0:
        return coins
    
    if money_to_return >= list_index_coins[actual_coin]:
        coins[actual_coin] += 1
        return solver(money_to_return - list_index_coins[actual_coin], actual_coin)
    
    elif actual_coin <= 13: #Es la 14 moneda en verdad
        return solver(money_to_return, actual_coin + 1)
    
"""
GitHub Copilot
La función solver es una función recursiva que se utiliza para resolver el problema del cambio de monedas. Aquí está el desglose de lo que hace cada línea:

def solver(money_to_return = money_to_return, actual_coin = 0): 
Esta línea define la función solver con dos parámetros: money_to_return, que es la cantidad de dinero que se necesita devolver, 
y actual_coin, que es el índice de la moneda actual que se está considerando en la lista list_index_coins. Si no se proporcionan argumentos al llamar a la función, 
money_to_return tomará el valor de la variable global money_to_return y actual_coin será 0.

money_to_return = round(money_to_return, 2) Esta línea redondea money_to_return a dos decimales. 
Esto es útil para evitar problemas de precisión al trabajar con números de punto flotante.

if money_to_return == 0: return coins Si money_to_return es 0, eso significa que hemos devuelto todo el dinero que necesitábamos devolver, 
por lo que la función devuelve la lista coins, que contiene la cantidad de cada moneda que se ha devuelto.

if money_to_return >= list_index_coins[actual_coin]: Esta línea comprueba si money_to_return es mayor o igual que el valor de la moneda actual. 
Si es así, eso significa que podemos devolver al menos una de estas monedas.

coins[actual_coin] += 1 Si podemos devolver al menos una moneda de la denominación actual, incrementamos el contador de esa moneda en la lista coins.

return solver(money_to_return - list_index_coins[actual_coin], actual_coin) 
Luego, la función se llama a sí misma recursivamente con el dinero restante (money_to_return - list_index_coins[actual_coin]) y la misma moneda (actual_coin), 
y devuelve el resultado de esta llamada.

elif actual_coin <= 13: return solver(money_to_return, actual_coin + 1) Si money_to_return es menor que el valor de la moneda actual y 
aún no hemos considerado todas las monedas (es decir, actual_coin <= 13), 
la función se llama a sí misma recursivamente con la misma cantidad de dinero (money_to_return) y la siguiente moneda (actual_coin + 1), 
y devuelve el resultado de esta llamada.
"""
    
def print_coins(coins):
    for i, coin in enumerate(coins):
        if i <=6: 
            print(f"Banknotes of {list_index_coins[i]} euros: {coin}")
        elif i <= 7:
            print(f"Coins of {list_index_coins[i]} euros: {coin}")
        elif i <= 8:
            print(f"Coins of {list_index_coins[i]} euro: {coin}")
        elif i <= 13:
            print(f"Coins of {int(list_index_coins[i]*100)} cents: {coin}")
        else:
            print(f"Coins of {int(list_index_coins[i]*100)} cent: {coin}")
            
print_coins(solver())