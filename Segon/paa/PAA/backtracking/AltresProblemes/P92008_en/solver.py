from pytokr import pytokr

item, items = pytokr(iter=True)

def solver(canvi, monedes = [200, 100, 50, 20, 10, 5, 2, 1], moneda_act = 0):
    if canvi <= 0:
        return 0
    
    if canvi - monedes[moneda_act] >= 0:
        solve1 = solver(canvi - monedes[moneda_act], monedes, moneda_act)
        ret = 1 + solve1
        
    elif moneda_act + 1 <= len(monedes):   
        solve2 = solver(canvi, monedes, moneda_act + 1)
        ret = solve2
    
    return ret
    
canvi = int(item())
while canvi != -1:
    print(f"{canvi}: {solver(canvi)}")
    canvi = int(item())