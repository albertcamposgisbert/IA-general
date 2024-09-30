from pytokr import pytokr

item, items = pytokr(iter=True)

m = int(item())
n = int(item())
strlist = [item() for _ in range(n)]
returnlist = []

def combinaciones(subset = [], index = 0):
    if len(subset) == m:
        strtoprint = "{"
        for i in range(len(subset)-1):
            strtoprint += str(subset[i] + ",")
        print(strtoprint + subset[len(subset) - 1] + "}")
        return None
    
    if index < n:
        subset2 = subset[:]
        subset2.append(strlist[index])
        combinaciones(subset2, index + 1)
        combinaciones(subset, index + 1)

combinaciones()
