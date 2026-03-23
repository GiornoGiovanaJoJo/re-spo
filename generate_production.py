import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Extract head and header
head_match = re.search(r'(<!DOCTYPE html>.*?<main>)', index_html, flags=re.DOTALL)
head_part = head_match.group(1) if head_match else ""

# Extract footer
footer_match = re.search(r'(<section class="py-24 lg:py-32" id="contacts".*?</html>)', index_html, flags=re.DOTALL)
footer_part = footer_match.group(1) if footer_match else ""

# In the head part, make 'Собственное производство' the title
head_part = head_part.replace('<title>RESPO - Надежные эксперты</title>', '<title>Собственное производство - RESPO</title>')
# Remove active class from Главная, add to Каталог or keep it neutral
head_part = head_part.replace('class="nav-link active text-[16px]">Главная', 'class="nav-link text-[16px]">Главная')

# Prepare main content
main_content = """
        <!-- Hero Section -->
        <section class="pt-[160px] lg:pt-[200px] pb-16 lg:pb-24 relative overflow-hidden" style="background: linear-gradient(135deg, rgba(233,245,255,1) 0%, rgba(228,243,215,1) 100%);">
            <div class="container-respo relative z-10 text-left">
                <h1 class="text-[40px] md:text-[56px] lg:text-[72px] text-respo-blue font-medium leading-[1.1] max-w-[1200px] mb-12">
                    Собственное производство оборудования
                </h1>
                <a href="#contacts" class="inline-block bg-[#7DD5FF] text-white px-10 py-4 rounded-full text-[16px] lg:text-[18px] font-medium hover:brightness-105 transition-all shadow-lg shadow-[#7DD5FF]/20">
                    Оставить заявку
                </a>
            </div>
        </section>

        <!-- Оборудование -->
        <section class="py-20 lg:py-28 bg-white">
            <div class="container-respo">
                <span class="text-respo-blue text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <h2 class="text-[36px] lg:text-[48px] text-respo-blue font-medium leading-[1.1] mb-12">Оборудование</h2>
                
                <div class="border-t border-respo-blue/10">
                    <!-- Item 1 -->
                    <div class="py-8 border-b border-respo-blue/10 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl">
                        <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">Система охлаждения закупорочных плит фасовочных упаковочных автоматов</h3>
                        <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
                            <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
                        </div>
                    </div>
                    <!-- Item 2 -->
                    <div class="py-8 border-b border-respo-blue/10 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl">
                        <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">Узел Раскачки и Дозировки концентратов хим реактивов</h3>
                        <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
                            <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
                        </div>
                    </div>
                    <!-- Item 3 -->
                    <div class="py-8 border-b border-respo-blue/10 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl">
                        <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">Модульная СИП станция</h3>
                        <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
                            <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Клапана -->
        <section class="py-10 bg-white">
            <div class="container-respo">
                <span class="text-respo-cyan text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <h2 class="text-[36px] lg:text-[48px] text-respo-cyan font-medium leading-[1.1] mb-12">Клапана</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <!-- Product 1 -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 lg:p-10 flex flex-col group hover:shadow-xl transition-shadow w-full max-w-[500px]">
                        <h3 class="text-[20px] text-respo-dark font-medium mb-8">Butterfly valves, SS304</h3>
                        <div class="w-full aspect-square bg-white rounded-[24px] mb-8 shadow-sm"></div>
                        <a href="product.html" class="w-full bg-[#7DD5FF] text-white py-4 rounded-full flex items-center justify-center space-x-3 hover:brightness-105 transition-all text-[16px] font-medium tooltip-trigger mt-auto">
                            <span>Добавить в корзину</span>
                            <img src="assets/shopping-bag.svg" alt="Cart" class="w-5 h-5 invert brightness-0">
                        </a>
                    </div>
                    <!-- Product 2 -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 lg:p-10 flex flex-col group hover:shadow-xl transition-shadow w-full max-w-[500px]">
                        <h3 class="text-[20px] text-respo-dark font-medium mb-8">Butterfly valves, SS304</h3>
                        <div class="w-full aspect-square bg-white rounded-[24px] mb-8 shadow-sm"></div>
                        <a href="product.html" class="w-full bg-[#7DD5FF] text-white py-4 rounded-full flex items-center justify-center space-x-3 hover:brightness-105 transition-all text-[16px] font-medium tooltip-trigger mt-auto">
                            <span>Добавить в корзину</span>
                            <img src="assets/shopping-bag.svg" alt="Cart" class="w-5 h-5 invert brightness-0">
                        </a>
                    </div>
                </div>
                
                <!-- Counter -->
                <div class="bg-[#E9F5FF] rounded-[24px] py-6 px-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <span class="text-[20px] lg:text-[24px] text-respo-dark/80 font-medium whitespace-nowrap">Счетчик установленных клапанов</span>
                    <span class="text-[20px] lg:text-[24px] text-respo-dark/40 font-medium">-</span>
                    <span class="text-[32px] lg:text-[40px] text-respo-blue font-medium tabular-nums tracking-wide">10000000</span>
                </div>
            </div>
        </section>

        <!-- Теплообменники -->
        <section class="py-20 lg:py-28 bg-white">
            <div class="container-respo">
                <span class="text-respo-cyan text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <h2 class="text-[36px] lg:text-[48px] text-respo-cyan font-medium leading-[1.1] mb-12">Теплообменники</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <!-- Item 1 -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 flex flex-col items-start aspect-[3/4]">
                        <div class="w-full flex-grow bg-white rounded-[24px] shadow-sm mb-6"></div>
                        <div class="text-[18px] text-respo-dark font-medium px-2">Размер 1</div>
                    </div>
                    <!-- Item 2 -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 flex flex-col items-start aspect-[3/4]">
                        <div class="w-full flex-grow bg-white rounded-[24px] shadow-sm mb-6"></div>
                        <div class="text-[18px] text-respo-dark font-medium px-2">Размер 2</div>
                    </div>
                    <!-- Item 3 -->
                    <div class="bg-[#F8F9FA] rounded-[32px] p-6 flex flex-col items-start aspect-[3/4]">
                        <div class="w-full flex-grow bg-white rounded-[24px] shadow-sm mb-6"></div>
                        <div class="text-[18px] text-respo-dark font-medium px-2">Размер 3</div>
                    </div>
                </div>

                <!-- Counter -->
                <div class="bg-[#E9F5FF] rounded-[24px] py-6 px-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <span class="text-[20px] lg:text-[24px] text-respo-dark/80 font-medium whitespace-nowrap">Счетчик установленных клапанов</span>
                    <span class="text-[20px] lg:text-[24px] text-respo-dark/40 font-medium">-</span>
                    <span class="text-[32px] lg:text-[40px] text-respo-blue font-medium tabular-nums tracking-wide">10000000</span>
                </div>
            </div>
        </section>

        <!-- Отзывы -->
        <section class="py-20 pt-10 pb-32" style="background: linear-gradient(180deg, rgba(233,245,255,0.3) 0%, rgba(175,221,255,1) 100%);">
            <div class="container-respo">
                <span class="text-respo-blue text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <div class="flex justify-between items-end mb-12">
                    <h2 class="text-[36px] lg:text-[48px] text-respo-blue font-medium leading-[1.1]">Отзывы покупателей</h2>
                    <a href="#" class="hidden md:flex items-center space-x-3 text-respo-dark font-medium hover:text-respo-blue transition-colors group">
                        <span class="text-[16px]">Смотреть больше</span>
                        <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5 opacity-60 group-hover:opacity-100 invert" style="filter: brightness(0) saturate(100%);">
                    </a>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Review 1 -->
                    <div class="bg-white rounded-[32px] p-8 lg:p-10 flex flex-col min-h-[300px]">
                        <p class="text-[15px] lg:text-[16px] text-respo-dark/80 font-sans leading-[1.6] mb-8">
                            "Очень довольна сотрудничеством с этой компанией. Всё делали аккуратно, в срок и с вниманием к нашим пожеланиям. Было приятно, что команда всегда на связи. Спасибо!"
                        </p>
                        <div class="mt-auto font-medium text-[18px] text-respo-dark">Анастасия С.</div>
                    </div>
                    <!-- Review 2 -->
                    <div class="bg-white rounded-[32px] p-8 lg:p-10 flex flex-col min-h-[300px]">
                        <p class="text-[15px] lg:text-[16px] text-respo-dark/80 font-sans leading-[1.6] mb-8">
                            "Очень довольна сотрудничеством с этой компанией. Всё делали аккуратно, в срок и с вниманием к нашим пожеланиям. Было приятно, что команда всегда на связи и помогает даже после сдачи проекта. Спасибо!"
                        </p>
                        <div class="mt-auto font-medium text-[18px] text-respo-dark">Полина</div>
                    </div>
                </div>
                
                <!-- Pagination Dots -->
                <div class="flex justify-center mt-12 space-x-3">
                    <div class="w-2.5 h-2.5 rounded-full bg-respo-blue opacity-100"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-white opacity-60 hover:opacity-100 cursor-pointer transition-opacity"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-white opacity-60 hover:opacity-100 cursor-pointer transition-opacity"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-white opacity-60 hover:opacity-100 cursor-pointer transition-opacity"></div>
                </div>
            </div>
        </section>

        <!-- Сертификаты -->
        <section class="py-20 lg:py-28 bg-white">
            <div class="container-respo">
                <span class="text-respo-blue text-[24px] lg:text-[32px] font-medium block leading-none mb-4">//</span>
                <h2 class="text-[36px] lg:text-[48px] text-respo-blue font-medium leading-[1.1] mb-12">Сертификаты на оборудование</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Cert 1 -->
                    <div>
                        <div class="w-full aspect-[3/4] bg-[#F7F7F7] mb-6 shadow-sm"></div>
                        <h4 class="text-[18px] font-medium text-respo-dark mb-4 pr-4">Насос центробежный серии CLA</h4>
                        <p class="text-[12px] text-respo-blue font-sans leading-[1.6]">
                            Насос центробежный серии CLA<br>
                            Декларация о соответствии принята на основании Протокола испытаний<br>
                            №ГС-04/10-0606 от 04.10.2023 года, выданного Испытательной лабораторией ООО «ГЕРИТ СЕЙФИТИ РУС».
                        </p>
                    </div>
                    <!-- Cert 2 -->
                    <div>
                        <div class="w-full aspect-[3/4] bg-[#F7F7F7] mb-6 shadow-sm"></div>
                        <h4 class="text-[18px] font-medium text-respo-dark mb-4 pr-4">Блок управления клапанами серии Control head</h4>
                        <p class="text-[12px] text-respo-blue font-sans leading-[1.6]">
                            Декларация о соответствии принята на основании Протокола испытаний<br>
                            №ГС-04/10-0607 от 04.10.2023 года, выданного Испытательной лабораторией ООО «ГЕРИТ СЕЙФИТИ РУС».
                        </p>
                    </div>
                    <!-- Cert 3 -->
                    <div>
                        <div class="w-full aspect-[3/4] bg-[#F7F7F7] mb-6 shadow-sm"></div>
                        <h4 class="text-[18px] font-medium text-respo-dark mb-4 pr-4">Седельный клапан (Серия PNV-IB), клапан противосмесительный Mixproof (Серия MPV-IA), регулирующий клапан (Серия FMV-IB), дисковой затвор (Серия BFV-IA)</h4>
                        <p class="text-[12px] text-respo-blue font-sans leading-[1.6]">
                            Декларация о соответствии принята на основании Протоколов испытаний<br>
                            №ГС-04/10-0608, ГС-04/10-0609, ГС-04/10-0610 от 04.10.2023 года, выданных Испытательной лабораторией ООО «ГЕРИТ СЕЙФИТИ РУС».
                        </p>
                    </div>
                </div>
            </div>
        </section>
"""

with open('production.html', 'w', encoding='utf-8') as f:
    f.write(head_part + main_content + footer_part)

print("production.html generated successfully!")
