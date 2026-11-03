"""Turn the source audit into a learner-facing exam and curriculum map."""
import json
from pathlib import Path

root=Path(__file__).resolve().parent
E=json.loads((root/'exam-audit.json').read_text(encoding='utf-8'))
# The representation matrix is a useful intermediate method in 2019/2020,
# but those questions explicitly ask for image/kernel, not the matrix itself.
# Keep that relationship visible without inflating the explicit task count.
for t in E['topics']:
    if t['id']=='map-matrix':
        t['relatedOccurrences']=t.get('relatedOccurrences',[])+[o for o in t['occurrences'] if o['year'] in (2019,2020)]
        t['occurrences']=[o for o in t['occurrences'] if o['year'] in (2021,2023)]
        t['paperCount']=2
        t['years']=[2021,2023]
    if t['id']=='image-kernel':t['title']='像、核及其计算应用'
    if t['id']=='idempotent':t['title']='幂等矩阵的性质与空间证明'
reasons={
 'subspace-sum':'起步重点。4/6卷出现；消元、基与维数可同时服务子空间计算与后续证明，先掌握可降低后面学习负担。',
 'image-kernel':'起步重点。5/6卷出现；核心动作是求主元列与解齐次方程，也是理解映射和正交补的基础。',
 'map-matrix':'明确要求多项式求基/指定基下矩阵见于2/6卷；2019、2020的像核题也可借助矩阵表示，但不混入本题型计数。',
 'orthogonal-complement':'优先练完整题。5/6卷出现；抓住“与每列正交”等价于解Aᴴy=0，可在基础恢复后较早开始。',
 'gram-qr':'优先练完整题。4/6卷出现；正交化步骤固定，需练投影系数、单位化及QᴴQ、QR两项检查。',
 'jordan':'主线重点。6/6卷出现；题目常把初等因子、不变因子、Jordan形与最小多项式一起问，须串成一套。',
 'spectral':'在对角化之后学习。3/6卷明确要求谱表示；还为矩阵函数提供方法，先区分普通谱投影与正交投影。',
 'norms':'小题重点。6/6卷出现；先把向量1/2/∞范数、矩阵诱导范数与F范数分别定义清楚，再做判断。',
 'gershgorin':'主线重点。5/6卷出现且多为独立计算题；写圆盘覆盖谱之后，还必须说明隔离与计数，2023未出现。',
 'series':'主线中需保留。2/6卷明确出现；矩阵几何级数是谱半径与矩阵函数的桥梁，不能只背标量公式。',
 'matrix-functions':'综合重点。6/6卷涉及矩阵函数或相关应用；先会算e^(tA)，再看微分方程扩展，勿把二者范围混同。',
 'full-rank':'主线基础分解。2/6卷明确要求满秩分解；同时支持广义逆计算，但隐含用到它的题不重复计为明确考题。',
 'least-squares':'范围待区分。6/6旧卷出现且学习通有第五章任务；本学期I大纲未单列，单列补充路线，不能据此推定今年必考。',
 'idempotent':'定义与证明训练。2/6卷出现；2023有10分证明，需从A²=A构造分解，不能只背数值计算。',
 'matrix-equation':'旧卷扩展任务。用于学习通相关补充与旧卷选练，先完成主线；逐元素法和向量化法要分清条件。'
}
methods={
 'subspace-sum':(['把生成元按列组成矩阵，求和空间时并列两组生成元。','消元选原矩阵主元列，得到和空间的一组基。','求交时令两种线性组合相等，解[B₁,−B₂](u,v)ᵀ=0，再代回得到交空间向量。','检查dim(U+V)+dim(U∩V)=dimU+dimV。'],'交与和都要给基或维数；维数公式只能在已知其余量时使用。'),
 'image-kernel':(['先明确A是m×n，核在数域n维空间、像在数域m维空间。','消元找主元列，回到原A选这些列作为像的一组基。','解Ax=0，把自由变量逐个拆出基础解系。','检查dim N(A)+rank A=n，并将核的基代回。'],'基向量尺寸正确、线性无关、张成目标空间，并满足秩零度关系。'),
 'map-matrix':(['按固定的标准基把多项式写成系数向量。','消元选原生成元的一组基B。','对每个bⱼ计算T(bⱼ)，再用B表示，求出坐标列。','将这些坐标列按顺序组成[T]B；用MP=P[T]B检查。'],'不能把像的标准系数直接当成指定基下坐标；先证明所选基确实张成。'),
 'orthogonal-complement':(['确认A的尺寸和外面的转置，决定答案向量分量数。','由与每列正交，列Aᴴy=0；实矩阵用Aᵀ。','消元并写自由变量通解，拆出一组基。','代回Aᴴy=0，并检查维数为m−rank A。'],'本题求基不自动要求标准正交基；只有题面要求时才进一步正交化。'),
 'gram-qr':(['按列顺序作Schmidt，逐次减去沿已有正交方向的投影。','每个非零余量单位化，得到qⱼ。','以qⱼ为列组Q，用rᵢⱼ=qᵢᴴaⱼ组R。','核对QᴴQ=I与QR=A，并注明薄QR或完整QR。'],'两项矩阵等式均通过；不能把未单位化的正交向量直接组成Q。'),
 'jordan':(['计算λI−A与特征多项式。','用各阶子式最大公因式Δₖ求dₖ=Δₖ/Δₖ₋₁，或按题给等价标准形读不变因子。','把非单位不变因子拆为素因子幂，得到初等因子。','每个(λ−λᵢ)^s对应一个s阶Jordan块；最大不变因子为最小多项式。','检查块大小和等于n、各根幂和与特征多项式一致。'],'不仅列特征值；四种数据需相互吻合。题目要求相似变换矩阵时还需求Jordan链。'),
 'spectral':(['先判断是否可对角化，列不同特征值λᵢ。','算谱投影Pᵢ=∏ⱼ≠ᵢ(A−λⱼI)/(λᵢ−λⱼ)。','写A=ΣλᵢPᵢ，或f(A)=Σf(λᵢ)Pᵢ。','检查ΣPᵢ=I、PᵢPⱼ=0(i≠j)与Pᵢ²=Pᵢ。'],'普通可对角化矩阵的谱投影未必是正交投影；实对称/正规情形另有正交性。'),
 'norms':(['先辨认对象是向量还是矩阵，以及范数下标或定义。','向量按绝对值和/平方和开根/最大绝对值计算。','矩阵1范数取最大列绝对值和，∞范数取最大行和，2范数用AᴴA最大特征值。','F范数为元素模平方和开根；谱半径是特征值模最大值，不能混同。'],'能从定义计算，并用反例区分F范数、诱导2范数和谱半径。'),
 'gershgorin':(['对角元为圆心，同一行其余元素模之和为半径。','画复平面圆盘，先说明谱包含于圆盘并集。','检查连通分支；孤立k个圆组成的分支含k个特征值，按代数重数。','隔离不足时尝试对角相似缩放，再重新计算所有半径和间距。'],'题面要求隔离时，只有覆盖结论不够；画图标出圆心、半径与计数依据。'),
 'series':(['先辨认一般矩阵级数还是几何级数。','几何级数ΣAᵏ当且仅当ρ(A)<1时收敛；相容范数小于1仅是充分条件。','利用有限和(I−A)Σₖ₌₀ᴺAᵏ=I−Aᴺ⁺¹取极限。','最后给出(I−A)⁻¹或按题面证明要求写清余项趋零。'],'ρ(A)<1的条件不能丢；ρ=1时不能用“可能收敛”混过矩阵几何级数判定。'),
 'matrix-functions':(['先查有无A²=cA或幂零等简化关系。','可对角化时用Pf(Λ)P⁻¹；否则在Jordan块上使用导数项。','指数导数对常矩阵A是Ae^(tA)，注意乘上A。','代回t=0、导数恒等式或满足的多项式关系检查。'],'能完整算矩阵函数与导数；微分方程应用还需单独学习初值和非齐次项处理。'),
 'full-rank':(['消元找r个主元列，回原矩阵组成m×r矩阵B。','逐列解Bcⱼ=aⱼ，把系数列组成r×n矩阵C。','写A=BC并核对乘积。','确认rank B=rank C=r。'],'因子尺寸、秩和乘积三项正确；不能直接用行最简形代替原A。'),
 'least-squares':(['先区分“精确解”“最小残差”“所有最小二乘解中最小长度”。','按满秩分解或SVD求A⁺，先检查适用条件。','极小范数最小二乘解为x*=A⁺b。','若问所有最小二乘解，再加(I−A⁺A)z，并检查Aᴴ(Ax*−b)=0。'],'一般解与极小范数解不可混写；列不满秩不能硬用(AᴴA)⁻¹Aᴴ。'),
 'idempotent':(['从A²=A出发解释N(A)和N(A−I)的条件。','求交时同时使用Ax=0与Ax=x，推出x=0。','任意x构造x=(x−Ax)+Ax，分别核验两项归属。','证明和覆盖全空间，再给直和与维数结论。'],'分解、归属与双向包含写齐；A²=A不意味着Aᴴ=A或正交投影。'),
 'matrix-equation':(['先查题型是AXB=D还是AX+XB=C，确认尺寸。','小尺寸可直接给X的元素设未知数，转化线性方程组。','使用向量化时按列vec，分别套用(Bᵀ⊗A)vec X或(I⊗A+Bᵀ⊗I)vec X。','检查相容性与自由参数，最后代回原矩阵方程。'],'矩阵乘法次序不能交换；一解、全部解和唯一可解条件要按题问区分。')
}
for t in E['topics']:
    t['priorityReason']=reasons[t['id']]
    t['method'],t['mastery']=methods[t['id']]
    t['task']='；'.join(t['method'][:2])
    if t['id']=='least-squares' or t['id']=='matrix-equation':t['scope']='旧卷 / 学习通补充'
    elif t['id']=='matrix-functions':t['scope']='大纲主线 + 应用扩展'
    else:t['scope']='本学期大纲主线'
    t['lessonIds']=list(dict.fromkeys(t['lessonIds']))

E['notes']=[
 '没有明确年份的试题1—8不纳入频次；同一份卷的答案版不作为额外一份卷。',
 '同一主题在同一份卷出现多次，只计这一份卷。像核题包含直接求像核及把正交补转为核的计算应用；各行考点允许交叠，分值不可相加。',
 '部分小题包含多空或跨主题，无法可靠拆分分值时不标单独分值；未标分值不表示零分。逐卷结构保留卷面大题分值。',
 '所有定位使用从1开始的PDF文件页序，可能与试卷印刷页码不同。',
 '试卷PDF的隐藏文本层含答案和错序内容；题面按可见页面核对，精讲解析独立推导。',
 '2019、2020的像核题可使用指定基下的矩阵表示，但题面没有明确要求输出该矩阵，故不计入“多项式求基/变换矩阵”出现卷数，只列关联题。'
]+E['keyFindings']
E['priorities']=[
 {'level':'先恢复','title':'消元 → 基与维数 → 像与核','reason':'这组工具能支持子空间、正交补和指定基下矩阵。先从能算的小题恢复，不先啃Jordan。','topicId':'image-kernel'},
 {'level':'先练整题','title':'正交补与 Schmidt / QR','reason':'分别见于5/6、4/6卷。把几何条件转成方程，或按投影步骤计算，较早形成整题能力。','topicId':'gram-qr'},
 {'level':'主线重点','title':'Jordan / 最小多项式 / 矩阵函数','reason':'相关任务均见于6/6卷。先补特征值，再把块、因子、多项式与函数连起来。','topicId':'jordan'},
 {'level':'小题与计算','title':'范数、谱半径与盖尔圆','reason':'范数见于6/6卷，盖尔圆见于5/6卷。定义和条件决定能否答对判断、填空及隔离题。','topicId':'norms'},
 {'level':'证明训练','title':'子空间与幂等矩阵','reason':'2023五为10分证明。需要会按定义构造与验证，课程中单独安排这类动作。','topicId':'idempotent'},
 {'level':'补充','title':'广义逆与最小二乘','reason':'旧卷6/6且学习通有任务，但当前I大纲未单列。保留课程与练习，单独注明范围。','topicId':'least-squares'}
]
topic_by_id={t['id']:t for t in E['topics']}
# Each tuple is a concrete role in a real exam question, not an assertion that
# one tool lesson alone covers a complete multi-part question.
connections={
 'b01':('orthogonal-complement','tool','消元求全部解','先会解齐次方程；还需 s04、m02 理解并建立正交条件。'),
 'b02':('full-rank','tool','辨认主元列和列秩','本节只负责选独立列；因子构造与验证在 d01。'),
 's01':('subspace-sum','tool','验证对象是线性子空间','还需 s02 求交、求和并计算维数。'),
 's02':('subspace-sum','direct','求和、交的一组基与维数','按本节流程可做具体生成元题；幂等矩阵的一般证明继续看 s05。'),
 's03':('map-matrix','tool','求基与指定基下的坐标','可完成多项式求基部分；变换矩阵还需 m01、m03。'),
 's04':('gram-qr','direct','Schmidt 正交化及单位化','可练标准正交基部分；将结果组装成 QR 分解继续 d02。'),
 's05':('idempotent','direct','从幂等条件构造直和并证明维数结论','本节解释 N(A)、R(A) 的含义和结构；系统求基方法在 m02。'),
 'm01':('map-matrix','tool','按定义判断并计算线性映射','完整指定基下矩阵题继续 m03；线性性判断本身可独立练。'),
 'm02':('image-kernel','direct','求像、核的一组基和维数','依赖 b01、b02；正交补还需理解内积条件。'),
 'm03':('map-matrix','direct','逐列求指定基下的变换矩阵','若生成元未必成基，先用 s03 和 b02 选出一组基。'),
 'm04':('jordan','tool','计算特征值和特征空间维数','本节不能直接给全部不变因子；整题继续 d06。'),
 'm05':('gram-qr','tool','检查正交/酉矩阵的条件','用于检查 QᴴQ=I；完整 QR 仍需 d02 的构造。'),
 'd01':('full-rank','direct','从主元列构造满秩分解','可做题面明确要求满秩分解的计算题；广义逆应用继续 e04。'),
 'd02':('gram-qr','direct','计算 Q、R 并核验 QR=A','先会 s04 的正交化；原题高维计算较长，需要独立完整练一次。'),
 'd03':('jordan','tool','用 Cayley–Hamilton 降低矩阵幂次数','用于核验矩阵多项式；求全部因子和Jordan形继续 d06。'),
 'd04':('spectral','tool','判断并完成相似对角化','对角化是谱分解的前提；完整谱投影表达继续 d05。'),
 'd05':('spectral','direct','求谱投影并写谱分解','若同时问 eᴬ，还要学习 a06 如何作用于谱投影。'),
 'd06':('jordan','direct','串联初等因子、不变因子、Jordan形和最小多项式','本节基础算例与真题精讲覆盖常见小阶题；求相似矩阵还需Jordan链训练。'),
 'a01':('norms','direct','计算向量范数并区分三种长度','只覆盖向量部分；矩阵范数与谱半径继续 a02— a04。'),
 'a02':('norms','direct','计算矩阵 1、∞、2 与 F 范数','题目涉及相容、诱导性质时还需 a03，谱半径看 a04。'),
 'a03':('norms','direct','按定义判断相容性与诱导关系','可做概念判定部分；逐项计算仍需 a01、a02。'),
 'a04':('gershgorin','direct','画盖尔圆并说明隔离与计数','真实旧卷还可能要相似缩放；题型页提供2017完整算例。'),
 'a05':('series','direct','用谱半径判定矩阵几何级数并求和','一般函数题继续 a06；不能把范数小于1误当必要条件。'),
 'a06':('matrix-functions','direct','计算矩阵指数及导数','先练2023指数导数；非齐次微分方程应用不由这一节自动覆盖。'),
 'e02':('least-squares','tool','通过 SVD 理解奇异值与伪逆','本节提供分解工具；伪逆计算继续 e04，最小二乘继续 e05。'),
 'e03':('least-squares','tool','区分广义逆与 Moore–Penrose 逆','本节是定义基础；求解具体最小二乘题还需 e04、e05。'),
 'e04':('least-squares','direct','计算 A⁺ 并核验 Penrose 条件','只做伪逆计算部分；通解与极小范数解继续 e05。'),
 'e05':('least-squares','direct','求极小范数最小二乘解','此任务在旧卷与学习通出现，当前I大纲未单列；范围单独标记。'),
 'e06':('matrix-equation','direct','将小矩阵方程转成线性方程组','vec方法须按列展开；Sylvester方程与AXB=D使用不同公式。')
}
E['lessonLinks']={}
tasks={
 'subspace-sum':'求两个子空间的和、交的基与维数。',
 'image-kernel':'求像和核的基、维数，并在相关问题中使用齐次方程。',
 'map-matrix':'先给多项式子空间选基，再求变换在所选基下的矩阵。',
 'orthogonal-complement':'求生成空间或矩阵值域的正交补。',
 'gram-qr':'对给定向量组正交化、单位化，或进一步求QR分解。',
 'jordan':'把初等因子、不变因子、Jordan形、最小多项式一起求出。',
 'spectral':'求谱投影，将矩阵或矩阵函数写成谱表示。',
 'norms':'计算范数与距离、区分范数和谱半径，判断相关性质。',
 'gershgorin':'画圆盘、隔离特征值并说明每个分离区域的计数。',
 'series':'判断矩阵级数敛散，使用并证明几何级数恒等式。',
 'matrix-functions':'计算矩阵指数或函数，求导；部分旧卷进一步问微分方程。',
 'full-rank':'将矩阵写成一个满列秩因子与一个满行秩因子的乘积。',
 'least-squares':'求广义逆，区分精确解、最小二乘解与极小范数解。',
 'idempotent':'由幂等条件研究矩阵性质或构造子空间的直和证明。',
 'matrix-equation':'解加法型矩阵方程AX+XB=C；与乘积型方程分开处理。'
}
for t in E['topics']:t['task']=tasks[t['id']]
for lid,(tid,role,task,boundary) in connections.items():
    t=topic_by_id[tid]
    candidates=t['occurrences']
    # Prefer a whole, specifically identified question with a prepared solution.
    worked=next((w for w in E['workedPast'] if w['topicId']==tid),None)
    o=({'ref':worked['ref'],'prompt':worked['prompt']} if worked else next((o for o in reversed(candidates) if o['points']),candidates[-1]))
    E['lessonLinks'][lid]=[{'topicId':tid,'role':'direct' if role=='direct' else 'prerequisite','label':o['ref']['label']+' · '+t['title'],'task':task,'boundary':boundary,'ref':o['ref']}]
perp=next(w for w in E['workedPast'] if w['topicId']=='orthogonal-complement')
E['lessonLinks']['m02'].append({'topicId':'orthogonal-complement','role':'direct','label':'2023 三2 · 值域的正交补','task':'从与各列正交写成 Aᴴy=0，并用自由参数给出一组基。','boundary':'用本节方法可完成整题；注意题面矩阵外面的转置，答案应有5个分量。','ref':perp['ref']})
# Avoid promising the entire first question as an immediate outcome of a tool.
for t in E['topics']:
    assert t['paperCount']==len({o['year'] for o in t['occurrences']}),t['id']
for p in E['papers']:
    assert sum(i['points'] for i in p['items'])==100
    for i in p['items']:i['task']=i['prompt']
(root/'exam-map.json').write_text(json.dumps(E,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"Exam map: {len(E['topics'])} tasks, {len(E['workedPast'])} worked real problems, {len(E['lessonLinks'])} lesson mappings")
