

import re

# Example 1: Match any character (except newline)
pattern1 = r"."
text1 = "Hello World!"
result1 = re.findall(pattern1, text1)
print(result1)  # Output: ['H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '!']


# Example 2: Match the start of a string
pattern2 = r"^Hello"
text2 = "Hello World!"
result2 = re.findall(pattern2, text2)
print(result2)  # Output: ['Hello']


# Example 3: Match the end of a string
pattern3 = r"World!$"
text3 = "Hello World!"
result3 = re.findall(pattern3, text3)
print(result3)  # Output: ['World!']


# Example 4: Match zero or more occurrences
pattern4 = r"ab*"
text4 = "a ab abb abbb abbbb"
result4 = re.findall(pattern4, text4)
print(result4)  # Output: ['a', 'ab', 'abb', 'abbb', 'abbbb']


# Example 5: Match one or more occurrences
pattern5 = r"ab+"
text5 = "a ab abb abbb abbbb"
result5 = re.findall(pattern5, text5)
print(result5)  # Output: ['ab', 'abb', 'abbb', 'abbbb']


# Example 6: Match zero or one occurrence
pattern6 = r"ab?"
text6 = "a ab abb abbb abbbb"
result6 = re.findall(pattern6, text6)
print(result6)  # Output: ['a', 'ab', 'ab', 'ab', 'ab']


# Example 7: Match exactly n occurrences
pattern7 = r"ab{2}"
text7 = "a ab abb abbb abbbb"
result7 = re.findall(pattern7, text7)
print(result7)  # Output: ['abb', 'abb', 'abb']


# Example 8: Match n or more occurrences
pattern8 = r"ab{2,}"
text8 = "a ab abb abbb abbbb"
result8 = re.findall(pattern8, text8)
print(result8)  # Output: ['abb', 'abbb', 'abbbb']


# Exemple 9: Match between n and m occurrences
pattern9 = r"ab{2,3}"
text9 = "a ab abb abbb abbbb"
result9 = re.findall(pattern9, text9)
print(result9)  # Output: ['abb', 'abbb', 'abbb']


# Example 10: Match a single character
pattern10 = r"l"
text10 = "Hello\nWorld!"
result10 = re.findall(pattern10, text10)
print(result10)


# Example 11: Match any digit
pattern11 = r"\d"
text11 = "Hello 123\n World!"
result11 = re.findall(pattern11, text11)
print(result11)  # Output: ['1', '2', '3']


# Example 12: Match any non-digit
pattern12 = r"\D"
text12 = "Hello 123\n World!"
result12 = re.findall(pattern12, text12)
print(result12)  # Output: ['H', 'e', 'l', 'l', 'o', ' ', ' ', 'W', 'o', 'r', 'l', 'd', '!']


# Exercici data
pattern = r"^(19|20)\d\d([./-])(0[1-9]|1[0-2])\2(0[1-9]|[12][0-9]|3[01])$" #^\d{4}([./-])[01][12]\1((3[01])|([012][1-9]))$ (Versión pocha)
text = "2024/02/20"
result = re.search(pattern, text)
print(result.string)


