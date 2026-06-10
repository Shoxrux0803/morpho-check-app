import ast
import os
import glob

def find_dict_assigned_to_key(node, key_name):
    # This naive visitor tries to find Dict nodes that are values for a key string matching `key_name`
    # or part of a variable assignment if the variable is a dict containing `key_name`.
    # Let's just walk the AST and find all Dict items where the key is a Constant string `key_name`.
    found_keys = set()
    for child in ast.walk(node):
        if isinstance(child, ast.Dict):
            for k, v in zip(child.keys, child.values):
                if isinstance(k, ast.Constant) and k.value == key_name:
                    if isinstance(v, ast.Dict):
                        for inner_k in v.keys:
                            if isinstance(inner_k, ast.Constant):
                                found_keys.add(inner_k.value)
    return found_keys

def get_dict_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    try:
        tree = ast.parse(content)
        uz_keys = find_dict_assigned_to_key(tree, 'uz')
        ru_keys = find_dict_assigned_to_key(tree, 'ru')
        return uz_keys, ru_keys
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return set(), set()

def main():
    backend_dir = os.path.join(os.path.dirname(__file__), 'morphocheck_backend', 'services')
    py_files = glob.glob(os.path.join(backend_dir, '*.py'))
    
    total_missing = 0
    for file_path in py_files:
        uz, ru = get_dict_keys(file_path)
        if uz:
            missing = uz - ru
            if missing:
                total_missing += len(missing)
                print(f"File: {os.path.basename(file_path)}")
                print(f"UZ keys: {len(uz)}, RU keys: {len(ru)}")
                print(f"Missing in RU: {missing}\n")
    if total_missing == 0:
        print("No missing dictionary keys in backend!")

if __name__ == '__main__':
    main()
