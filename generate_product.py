import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Extract head and header
head_match = re.search(r'(<!DOCTYPE html>.*?<main>)', index_html, flags=re.DOTALL)
head_part = head_match.group(1) if head_match else ""

# Extract footer
footer_match = re.search(r'(<section class="py-24 lg:py-32" id="contacts".*?</html>)', index_html, flags=re.DOTALL)
footer_part = footer_match.group(1) if footer_match else ""

# Extract reviews from production.html
try:
    with open('production.html', 'r', encoding='utf-8') as f:
        prod_html = f.read()
    reviews_match = re.search(r'(<!-- Отзывы -->.*?)</section>', prod_html, flags=re.DOTALL)
    reviews_part = reviews_match.group(1) + "</section>" if reviews_match else ""
except:
    reviews_part = ""

# In the head part, adjust title
head_part = head_part.replace('<title>RESPO - Надежные эксперты</title>', '<title>Butterfly valves, SS304 - RESPO</title>')
head_part = head_part.replace('class="nav-link active text-[16px]">Главная', 'class="nav-link text-[16px]">Главная')

main_content = """
        <!-- Product Details -->
        <section class="pt-[160px] lg:pt-[200px] pb-16 lg:pb-24 bg-white">
            <div class="container-respo">
                <span class="text-respo-cyan text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <h1 class="text-[40px] md:text-[56px] lg:text-[72px] text-respo-cyan font-medium leading-[1.1] mb-12 lg:mb-20">
                    Butterfly valves, SS304
                </h1>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <!-- Left: Image Gallery -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 lg:p-10 flex flex-col items-center justify-center min-h-[500px] lg:min-h-[700px] relative">
                        <div class="w-full h-full bg-white rounded-[24px] shadow-sm absolute inset-6 lg:inset-10"></div>
                        <!-- Dots overlay -->
                        <div class="absolute bottom-10 left-0 right-0 flex justify-center space-x-3 z-10">
                            <div class="w-2.5 h-2.5 rounded-full bg-respo-blue opacity-100"></div>
                            <div class="w-2.5 h-2.5 rounded-full bg-respo-blue opacity-30 cursor-pointer hover:opacity-100 transition-opacity"></div>
                            <div class="w-2.5 h-2.5 rounded-full bg-respo-blue opacity-30 cursor-pointer hover:opacity-100 transition-opacity"></div>
                            <div class="w-2.5 h-2.5 rounded-full bg-respo-blue opacity-30 cursor-pointer hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    
                    <!-- Right: Product Info -->
                    <div class="flex flex-col justify-start pt-4 lg:pt-10">
                        <ul class="text-respo-cyan text-[16px] lg:text-[18px] font-sans font-medium space-y-4 mb-20">
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 25</a></li>
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 38</a></li>
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 51</a></li>
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 63.5</a></li>
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 76.1</a></li>
                            <li class="flex items-center space-x-3"><div class="w-1.5 h-1.5 rounded-full bg-respo-cyan"></div> <a href="#" class="hover:underline underline-offset-4">BFV IA type NC, SS304, size 101.6</a></li>
                        </ul>
                        
                        <button class="bg-[#7DD5FF] text-white py-4 px-10 rounded-full flex items-center justify-center space-x-3 hover:brightness-105 transition-all text-[16px] font-medium w-fit min-w-[280px] shadow-lg shadow-[#7DD5FF]/20">
                            <span>Добавить в корзину</span>
                            <img src="assets/shopping-bag.svg" alt="Cart" class="w-5 h-5 invert brightness-0">
                        </button>
                    </div>
                </div>
            </div>
        </section>
"""

with open('product.html', 'w', encoding='utf-8') as f:
    f.write(head_part + main_content + reviews_part + footer_part)

print("product.html generated successfully!")
