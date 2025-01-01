def powerset(iterable):
    "itertools recipe in https://docs.python.org/3/library/itertools.html#itertools-recipes"
    from itertools import chain, combinations 
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s)+1))

def total(data, choices):
    return sum( data[i] for i in choices )

def knapsack(weights, values, n_items, max_w):
	mx = 0
	best = None
	for cand in powerset(range(n_items)):
		if total(weights, cand) <= max_w:
			val = total(values, cand)
			if val > mx:
				best = cand
				mx = val
	return best
