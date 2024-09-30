"""
Calling different ways of solving opt knapsack

Jose L Balcazar, 2024, based on earlier programs by several sources
"""

from time import process_time
from pytokr import pytokr
item, items = pytokr(iter = True)

from knapsack_opt_exh_pws_lab import knapsack as slow_knapsack
from knapsack_opt_bt import knapsack

for max_w in items(): 
	max_w = int(max_w)
	n_it = int(item())
	weights = []
	values = []
	for itm in range(n_it):
		weights.append(int(item()))
		values.append(int(item()))
	print("Powerset-based exhaustive search:")
	start = process_time()
	sol = slow_knapsack(weights, values, n_it, max_w)
	tm = process_time() - start
	print(f"time: {1000*(tm):3.6f} ms")
	print(sol) 
	print("Backtracking scheme:")
	start = process_time()
	sol, sol_w, sol_v = knapsack(weights, values, n_it - 1, max_w)
	tm = process_time() - start
	print(f"time: {1000*(tm):3.6f} ms")
	print(sol, sol_w, sol_v) 
