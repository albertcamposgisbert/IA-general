"""
Knapsack by backtracking, all solutions, explicit single candidate

Jose L Balcazar, 2024, based on earlier files, maybe by others
"""

def knapsack(weights, values, current_item, max_w, min_v, cand, cand_w, cand_v):
	if current_item == -1:
		if cand_v >= min_v and cand_w <= max_w:
			return [ cand.copy() ]
		else:
			return list()
	else: 
		"current_item >= 0" 
		sols = knapsack(weights, values, current_item - 1, max_w, min_v, cand, cand_w, cand_v)
		if weights[current_item] <= max_w:
			cand.append(current_item)
			sols.extend(
				knapsack(weights, values, current_item - 1, 
					max_w, min_v, cand, 
					cand_w + weights[current_item],
					cand_v + values[current_item]))
			cand.pop()
		return sols

# ~ print(knapsack([1, 2, 1], [10, 20, 30], 2, 2, 11, [], 0, 0))

if __name__ == "__main__":
	from pytokr import pytokr
	read = pytokr()
	minv = int(read())
	maxw = int(read())
	itq = int(read())
	weights = []
	values = []
	for _ in range(itq):
		weights.append(int(read()))
		values.append(int(read()))
	sols = knapsack(weights, values, itq - 1, maxw, minv, [], 0, 0)
	for sol in sols:
		print(' '.join(map(str, sol)))
