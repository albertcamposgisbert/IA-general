"""
Decisional knapsack, exhaustive tree-based, all solutions

Jose L Balcazar, 2024, based on earlier files, maybe by others
"""

def knapsack(weights, values, current_item, max_w, min_v):
    if current_item == -1:
        "all items considered, none left"
        if min_v <= 0 and max_w >= 0:
            return [ list() ]
        else:
            return list()
    sols0 = knapsack(weights, values, current_item - 1, max_w, min_v)
    sols1 = knapsack(weights, values, current_item - 1, 
                    max_w - weights[current_item],
                    min_v - values[current_item])
    sols0.extend( sol + [ current_item ] for sol in sols1 )
    return sols0
