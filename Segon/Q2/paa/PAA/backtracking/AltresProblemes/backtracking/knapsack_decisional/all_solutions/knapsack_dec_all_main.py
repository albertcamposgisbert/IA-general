"""
Calling different ways of solving knapsack, first solution

Jose L Balcazar, 2024, based on earlier programs by several sources
"""

from pytokr import pytokr
from time import process_time

read = pytokr()

from knapsack_dec_all_exh_pws_lab import slow_dec_knapsack as pws_knapsack
from knapsack_dec_all_exh_tr_lab import knapsack as tree_knapsack
from knapsack_dec_all_bt import knapsack as bt_knapsack

# ~ for mxw in items(): # to run several cases at once
    # ~ mxw = int(mxw)

max_w = int(read())
min_v = int(read())
n_it = int(read())
weights = []
values = []
for itm in range(n_it):
    weights.append(int(read()))
    values.append(int(read()))
print("Powerset-based exhaustive search:")
start = process_time()
sol_pws = pws_knapsack(weights, values, n_it, max_w, min_v)
tm = process_time() - start
print(f"time: {1000*(tm):3.6f} ms")
print("Tree-based exhaustive search:")
start = process_time()
sol_tr = tree_knapsack(weights, values, n_it - 1, max_w, min_v)
tm = process_time() - start
print(f"time: {1000*(tm):3.6f} ms")
print("Backtracking scheme:")
start = process_time()
sol_bt = bt_knapsack(weights, values, n_it - 1, max_w, min_v)
tm = process_time() - start
print(f"time: {1000*(tm):3.6f} ms")
# ~ print(sol_pws) #, sum(values[e] for e in sol))
# ~ print(sol_tr) #, sum(values[e] for e in sol))
# ~ print(sol_bt) #, sum(weights[e] for e in sol), sum(values[e] for e in sol))
