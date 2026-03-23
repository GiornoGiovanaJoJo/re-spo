import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Hero padding
html = html.replace('pt-[140px] lg:pt-[180px]', 'pt-[110px] lg:pt-[130px]')

# 2. Add 'Группа компаний «РЕ-СПО»' to Hero
hero_title_orig = """<h1
                            class="text-[36px] md:text-[52px] lg:text-[72px] lg:leading-[1.1] text-respo-cyan font-heading font-medium tracking-tight">
                            Надежные эксперты —<br>
                            отличная работа завода
                        </h1>"""
hero_title_new = """<span class="text-[18px] lg:text-[24px] text-respo-dark font-medium block mb-2">Группа компаний «РЕ-СПО»</span>
                        <h1
                            class="text-[36px] md:text-[52px] lg:text-[72px] lg:leading-[1.1] text-respo-cyan font-heading font-medium tracking-tight">
                            Надежные эксперты —<br>
                            отличная работа завода
                        </h1>"""
html = html.replace(hero_title_orig, hero_title_new)

# 3. Add header contact info
header_nav_orig = """<a href="#" id="btn-login"
                    class="bg-[#B2CD50] text-white px-8 py-3 rounded-full hover:brightness-105 transition-all text-[16px] font-medium">Войти</a>"""
header_nav_new = """<div class="hidden xl:flex flex-col items-end mr-6">
                    <span class="text-respo-dark font-medium leading-tight text-sm">INFO@re-spo.com</span>
                    <span class="text-respo-blue font-bold leading-tight">+7 (495) 961 62 15</span>
                </div>
                <!-- a href="#" id="btn-login" class="bg-[#B2CD50] text-white px-8 py-3 rounded-full hover:brightness-105 transition-all text-[16px] font-medium">Войти</a -->"""
html = html.replace(header_nav_orig, header_nav_new)

# 4. Update services text in hero
services_orig = """Технологический<br>
                            аудит, оптимизация<br>
                            и обслуживание<br>
                            молочных заводов"""
services_new = """Изготовление пищевого оборудования,<br>
                            Технологический аудит,<br>
                            Модернизация оборудования «под ключ»,<br>
                            Оптимизация технологических процессов и<br>
                            Обслуживание заводов пищевого производства"""
html = html.replace(services_orig, services_new)

# 5. About text
about_orig = """<p class="mb-8">Компания РЕ-СПО была основана в 2010 году, собрав экспертов молочной индустрии с
                            многолетним опытом. Наши клиенты — лидеры рынка и ведущие производители молочных продуктов
                            питания в России, Европе и Америке. Для каждого из них мы находим различные способы повысить
                            качество продукции и оптимизировать производственный процесс.</p>
                        <p>Специалисты нашей команды постоянно обучаются и способны обеспечить безопасную, качественную
                            и эффективную работу молочного производства по всем направлениям.</p>"""
about_new = """<p class="mb-4">Компания РЕ-СПО была основана в 2010 году, собрав экспертов молочной индустрии с многолетним опытом.</p>
                        <p class="mb-4">Наши клиенты — Лидеры рынка и ведущие производители молочных продуктов питания в России, Европе и Америке.</p>
                        <p class="mb-4">Для каждого из них мы находим различные способы повысить качество продукции, оптимизировать производственные процессы и обеспечить надежность завода, в том числе за счет импортозамещения - собственного производства оборудования наивысшего качества.</p>
                        <p>Специалисты нашей команды постоянно обучаются и способны обеспечить безопасную, качественную и Эффективную работу молочного пищевого производства по всем направлениям.</p>"""
html = html.replace(about_orig, about_new)

# 6. Categories Titles
html = html.replace('Наши 4\n                        основные категории', 'Основные направления нашей работы')
html = html.replace('проектирование технологических линий «под ключ»', 'комплексное проектирование и реализация проектов технологических линий')
html = html.replace('производство оборудования для пищевой промышленности', 'импортозамещение: собственный завод по производству оборудования для пищевой промышленности')

# Also point catalog button to production.html
html = html.replace('href="#catalog"', 'href="production.html"')

# 7. Remove 'Мы помогаем', 'Мы снижаем' and 'Почему мы?'
# They are sections with comments before them.
# We will use regex to remove them.

# "Мы помогаем" section
html = re.sub(r'<!-- Мы помогаем -->.*?<!-- Мы снижаем -->', '<!-- Мы снижаем -->', html, flags=re.DOTALL)
# "Мы снижаем" section
html = re.sub(r'<!-- Мы снижаем -->.*?<!-- Технологический аудит производства -->', '<!-- Технологический аудит производства -->', html, flags=re.DOTALL)
# "Почему мы?" section
html = re.sub(r'<!-- Почему мы\? -->.*?<!-- Optimization Section -->', '<!-- Optimization Section -->', html, flags=re.DOTALL)


# 8. Tech Audit texts
audit_o1_orig = "01 Определение причин"
html = html.replace(audit_o1_orig, "Определение причин")
audit_o2_orig = "02 Проведение оценки"
html = html.replace(audit_o2_orig, "Проведение оценки")
audit_o3_orig = "03 Разработка предложений"
html = html.replace(audit_o3_orig, "Разработка решений")

html = html.replace("""<li class="flex items-start"><span class="mr-2">•</span> технологических процессов работы оборудования;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> персонала.</li>""", 
                                        """<li class="flex items-start"><span class="mr-2">•</span> технологических процессов;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> работы оборудования;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> персонала.</li>""")

html = html.replace("""<li class="flex items-start"><span class="mr-2">•</span> по модернизации технологического оборудования;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> по обучению персонала.</li>""",
                                        """<li class="flex items-start"><span class="mr-2">•</span> по модернизации технологического оборудования;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> по обучению персонала;</li>
                                        <li class="flex items-start"><span class="mr-2">•</span> по устранению проблем Заказчика.</li>""")

# 9. Move "Наши ценности" inside "О компании"
# The section is <section class="py-24 lg:py-32 bg-white" id="values">
# We should extract it, remove it, and append it to the end of <section id="about">.
values_match = re.search(r'(<!-- Principles Section -->.*?)</section>', html, flags=re.DOTALL)
if values_match:
    values_content = values_match.group(1) + "</section>"
    html = html.replace(values_content, "")
    # Append to about section
    html = html.replace('</section>\n\n        <!-- Categories Section -->', f'\n{values_content}\n</section>\n\n        <!-- Categories Section -->')

# 10. Update "Популярные товары"
html = html.replace('Популярные товары', 'Собственное производство оборудования')

# Adding Placeholders for "Ключевые компетенции" and "Реализованные проекты"
placeholders = """
        <!-- Ключевые компетенции (Placeholder) -->
        <section class="py-16 bg-respo-blue-light" id="competencies">
            <div class="container-respo text-center">
                <h2 class="text-[32px] lg:text-[48px] text-respo-blue font-medium mb-8">Ключевые компетенции</h2>
                <div class="p-12 border-2 border-dashed border-respo-cyan rounded-xl text-respo-dark/50">
                    <p>Текст и фото из презентации будут вставлены здесь.</p>
                </div>
            </div>
        </section>

        <!-- Реализованные проекты (Placeholder) -->
        <section class="py-16 bg-white" id="projects">
            <div class="container-respo text-center">
                <h2 class="text-[32px] lg:text-[48px] text-respo-blue font-medium mb-8">Реализованные проекты</h2>
                <div class="p-12 border-2 border-dashed border-respo-green rounded-xl text-respo-dark/50">
                    <p>Текст и фото из презентации будут вставлены здесь.</p>
                </div>
            </div>
        </section>
"""
# Insert before Principles / Catalog
html = html.replace('<!-- Catalog Preview Section -->', placeholders + '\n        <!-- Catalog Preview Section -->')


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("index.html updated successfully!")
