"""
Decisional knapsack by simple backtracking

Jose L Balcazar, 2024, based on earlier files, maybe by others
"""

def knapsack(weights, values, current_item, max_w, min_v):
	if current_item == -1:
		"all items considered, none left"
		return list() if min_v <= 0 else None
	sol = knapsack(weights, values, current_item - 1, max_w, min_v)
	if sol is None and weights[current_item] <= max_w:
		"current_item >= 0 is a valid item to consider next" 
		sol = knapsack(weights, values, current_item - 1, 
		               max_w - weights[current_item], 
		               min_v - values[current_item])
		if sol is not None:
			sol.append(current_item)
	return sol

from pytokr import pytokr
read = pytokr()

min_v = int(read())
max_w = int(read())
n_it = int(read())
weights = []
values = []
for itm in range(n_it):
    weights.append(int(read()))
    values.append(int(read()))
sol = knapsack(weights, values, n_it - 1, max_w, min_v)
print(sol, sum(weights[e] for e in sol), sum(values[e] for e in sol))
