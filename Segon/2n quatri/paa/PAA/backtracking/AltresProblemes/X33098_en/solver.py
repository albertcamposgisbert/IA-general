"""
8
1 	5 	8 	9 	10 	
17 	17 	20

5
25 60 75 100 112.50
"""

from pytokr import pytokr

item, items = pytokr(iter=True)

num_pot = int(item())
pot_profit = []

for i in range(num_pot):
    pot_profit.append(float(item()))

def make_pot(act_item = 0, weight = num_pot, val = 0):
    # Cortar la lista de pesos
    if weight == 0:
        return val
    
    sol1 = -float('inf')
    sol2 = -float('inf')

    # Estas dos condiciones representan dos posibles decisiones que puedes tomar en cada paso de la recursión (Hacen el arbol recursivo de decisiones)
    #ESTE PRIMER CONDICIONAL SOLO SE UTILIZA PARA PASAR AL SIGUIENTE ELEMENTO DE LA LISTA (act_item+2) Y NO INCLUIR EL ELEMENTO ACTUAL (act_item) EN LA SOLUCIÓN
    if act_item + 2 <= weight:
        sol1 = make_pot(act_item+1, weight, val)
        
    if act_item + 1 <= weight:
        sol2 = make_pot(act_item, weight-(act_item + 1), val+pot_profit[act_item]) #Empieza por el elemento de mayor peso de la lista, el elemento 5
        
    """
    if act_item + 2 <= weight: sol1 = make_pot(act_item+1, weight, val): Esta línea representa la decisión de no incluir el elemento actual (act_item) en la solución. 
    En este caso, avanzas al siguiente elemento (act_item+1) sin cambiar el peso restante (weight) ni el valor acumulado (val).

    if act_item + 1 <= weight: sol2 = make_pot(act_item, weight-(act_item + 1), val+pot_profit[act_item]): 
    Esta línea representa la decisión de incluir el elemento actual (act_item) en la solución. En este caso, 
    te quedas en el mismo elemento (act_item), pero reduces el peso restante (weight) en act_item + 1 y aumentas el valor acumulado (val) en pot_profit[act_item].
    
    """
    
    
    val = max(sol1, sol2)

    return val

print(f"{make_pot():.2f}")


"""
El código que has proporcionado parece ser una implementación del problema de corte de varilla (Rod Cutting Problem), que es un problema clásico de programación dinámica. 
En este problema, se te da una varilla de longitud `n` y un array de precios `p[i]` para `i = 1, 2, ..., n`. El objetivo es cortar la varilla y vender los pedazos de manera que se maximice el beneficio total.

El input que has proporcionado es:

```
8
1 	5 	8 	9 	10 	17 	17 	20 
```

Esto significa que la longitud de la varilla es 8 y los precios de los pedazos de longitud 1 a 8 son 1, 5, 8, 9, 10, 17, 17 y 20 respectivamente.

El código utiliza una función recursiva `make_pot` para calcular el beneficio máximo que se puede obtener. En cada paso, tiene dos opciones: 

1. No cortar la varilla en este paso (es decir, dejar la longitud de la varilla como está y pasar al siguiente paso). 
   Esto se representa en el código como `sol1 = make_pot(act_item+1, weight, val)`.

2. Cortar la varilla en este paso (es decir, reducir la longitud de la varilla en `act_item + 1` y añadir el precio del pedazo cortado al beneficio total). 
   Esto se representa en el código como `sol2 = make_pot(act_item, weight-(act_item + 1), val+pot_profit[act_item])`.

Finalmente, elige la opción que da el beneficio máximo.

Para el input proporcionado, la solución óptima es cortar la varilla en dos pedazos de longitud 2 y 6. 
Los precios de los pedazos de longitud 2 y 6 son 5 y 17 respectivamente, por lo que el beneficio total es 5 + 17 = 22. Por eso, el código devuelve 22.00.
"""