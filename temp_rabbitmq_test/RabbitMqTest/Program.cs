using System;
using System.Linq;
using System.Reflection;

class Program
{
    static void Main()
    {
        var asm = Assembly.Load("RabbitMQ.Client");
        var t = asm.GetType("RabbitMQ.Client.IChannel");
        if (t == null) { Console.WriteLine("IChannel not found"); return; }
        foreach (var m in t.GetMethods(BindingFlags.Public | BindingFlags.Instance).Where(m => m.Name.Contains("BasicProperties") || m.Name.Contains("CreateBasic")))
        {
            Console.WriteLine(m);
            Console.WriteLine("  Return type: " + m.ReturnType.FullName);
            Console.WriteLine("  Params: " + string.Join(", ", m.GetParameters().Select(p => p.ParameterType.FullName + " " + p.Name)));
        }
    }
}
