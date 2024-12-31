import re
import unicodedata

def clean_text(text):
    """
    Cleans a given text by:
    - Lowercasing
    - Removing punctuation
    - Removing numbers (optional)
    - Removing extra whitespace
    """
    # Convert to lowercase
    text = text.lower()
    # Remove special punctuation
    text = text.replace("’", "'").replace("“", '"').replace("”", '"')
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def remove_accents(text):
    """
    Removes accents from text, such as "café" -> "cafe".
    """
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

def normalize_line(line):
    """
    Normalize a single line of text.
    """
    # Remove accents
    line = remove_accents(line)
    # Clean text
    line = clean_text(line)
    return line

def normalize_file(input_path, output_path):
    """
    Normalize an entire file, line by line.
    """
    with open(input_path, 'r', encoding='utf-8') as infile, open(output_path, 'w', encoding='utf-8') as outfile:
        for line in infile:
            # Normalize each line
            normalized_line = normalize_line(line)
            # Write normalized line to output
            if normalized_line:  # Skip empty lines
                outfile.write(normalized_line + '\n')

# Paths to the input and output files
input_file = 'dataset.txt'
output_file = 'normalized_dataset.txt'

# Run normalization
normalize_file(input_file, output_file)
print(f"Normalization complete. Normalized dataset saved to '{output_file}'")
