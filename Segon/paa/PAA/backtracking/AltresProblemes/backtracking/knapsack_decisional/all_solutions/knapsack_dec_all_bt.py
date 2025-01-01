"""
Decisional knapsack by backtracking

Jose L Balcazar, 2024, based on earlier files, maybe by others
"""

def knapsack(weights, values, current_item, max_w, min_v):
	if current_item == -1:
		"all items considered, none left"
		if min_v <= 0:
			return [ list() ]
		else:
			return list()
	sols0 = knapsack(weights, values, current_item - 1, max_w, min_v)
	if weights[current_item] <= max_w:
		"current_item >= 0 is a valid item to consider next" 
		sols1 = knapsack(weights, values, current_item - 1, 
			max_w - weights[current_item],
			min_v - values[current_item])
		sols0.extend( sol + [ current_item ] for sol in sols1 )
	return sols0


if __name__ == "__main__":
	from pytokr import pytokr

	def total(data, choices):
		return sum( data[i] for i in choices )

	read, loop = pytokr(iter = True)
	minv = int(read())
	maxw = int(read())
	itq = int(read())
	weights = []
	values = []
	for _ in range(itq):
		weights.append(int(read()))
		values.append(int(read()))
	sols = knapsack(weights, values, itq - 1, maxw, minv)
	for sol in sols:
		print(' '.join(map(str, sol)), total(weights, sol), total(values, sol))
