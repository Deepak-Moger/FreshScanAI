from pathlib import Path
import ast


source_path = Path("app.py")
ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
