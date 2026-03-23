import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # XML namespace for Word
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for paragraph in tree.findall('.//w:p', namespaces):
                texts = [node.text
                         for node in paragraph.findall('.//w:t', namespaces)
                         if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    # Hardcoded path to avoid encoding issues via sys.argv
    path = r"C:\Users\sukuna\Downloads\RESPO\правки\Комментарии.docx"
    text = extract_text_from_docx(path)
    with open('comments_utf8.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Done writing to comments_utf8.txt")
