"""
Slow knapsack by exhaustive search on powerset iterator, all solutions

Jose L Balcazar, 2024, based on earlier files, maybe by others
"""

def powerset(iterable):
    "itertools recipe in https://docs.python.org/3/library/itertools.html#itertools-recipes"
    from itertools import chain, combinations 
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s)+1))

def total(data, choices):
    return sum( data[i] for i in choices )

def slow_dec_knapsack(weights, values, n_items, max_w, min_v):
    sols = list()
    for cand in powerset(range(n_items)):
        if total(weights, cand) <= max_w and total(values, cand) >= min_v:
            sols.append(cand)
    return sols
