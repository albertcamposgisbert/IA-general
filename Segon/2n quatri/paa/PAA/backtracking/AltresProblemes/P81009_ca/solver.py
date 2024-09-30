import sys

input = sys.stdin

def solver(canvi, monedes, num_monedes, moneda_act = 0):
    if canvi == 0:
        return 0
    
    val1 = float("inf")
    val2 = float("inf")
    
    if canvi - monedes[moneda_act] >= 0:
        solve1 = solver(canvi - monedes[moneda_act], monedes, num_monedes, moneda_act)
        val1 = 1 + solve1 if type(solve1) == int else float("inf")
        
    if moneda_act + 1 <= num_monedes:   
        solve2 = solver(canvi, monedes, num_monedes, moneda_act + 1)
        val2 = solve2 if type(solve2) == int else float("inf")
        
    ret = min(val1, val2)
    
    return ret if ret != float("inf") else "no"

def greedy_solver(canvi, monedes):
    monedes.sort(reverse=True)  # Ordena las monedas en orden descendente
    num_monedes = 0
    for moneda in monedes:
        while canvi >= moneda:
            canvi -= moneda
            num_monedes += 1
        if canvi == 0:
            return num_monedes
    return "no" if canvi > 0 else num_monedes

def greedy_solver_recursive(canvi, monedes, num_monedes=0):
    if canvi == 0:
        return num_monedes
    for moneda in monedes:
        if canvi >= moneda:
            return greedy_solver_recursive(canvi - moneda, monedes, num_monedes + 1)
    return "no"
    
for line in input:
    line_split = line.split()
    canvi, num_monedes, monedes = float(line_split[0]), float(line_split[1]), line_split[2:]
    monedes.reverse()
    monedes = [float(item) for item in monedes]
    print(solver(canvi, monedes, num_monedes - 1))
    
    