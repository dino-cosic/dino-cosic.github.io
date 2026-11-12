---
title: "Deep Dive into Azure Functions: Building Serverless Applications"
description: "What Azure Functions are, when to use them, how triggers and bindings work, and how hosting plans affect scaling and timeouts, with C# examples."
date: 2024-01-19
updated:
slug: "deep-dive-into-azure-functions-building-serverless-applications"
tags:
  - "Azure"
  - "Azure Functions"
  - "Serverless"
  - ".NET"
coverImage:
coverAlt:
mediumUrl: "https://medium.com/@dino.cosic/deep-dive-into-azure-functions-building-serverless-applications-a3c21ccdac5c"
canonicalUrl:
draft: false
---

Serverless computing has been incredibly popular in recent times, completely changing how developers create and implement apps. *Microsoft Azure* is a well-known cloud provider that offers serverless computing services. Its solution, ***Azure Functions***, is particularly strong and scalable.

![Azure Functions logo](/assets/blog/deep-dive-into-azure-functions-building-serverless-applications/01.png)

We are going to describe the concept of Azure Functions in this article, examining its main attributes, advantages, and how to use it to create serverless apps.

## Understanding Azure Functions as Serverless App Pattern

**Serverless computing** as an idea allows developers to build applications faster by focusing on code development. By using this approach developers don’t need to manage infrastructure. In this case, the cloud provider is the one responsible for infrastructure management and scaling. As a result, developers can provide greater value to the business by concentrating more on building against business requirements. This approach reduces the time needed to develop features and boosts production.

> **Azure Functions** is a cloud service available on-demand that provides all the continually updated infrastructure and resources needed to run your applications

With **Azure Functions** you do not have to worry about the deployment or maintenance of servers. You can write code directly on Azure Portal or develop Function Apps in Visual Studio. The developers are allowed to write code while relying on Azure it will manage the infrastructure and supply all the up-to-date resources needed to keep your Function Apps running. You begin development by choosing a specific event that triggers the process and you code for a specific scenario. In the following section, we will discuss different development scenarios that can be handled by Azure Functions.

## When to use Azure Functions?

When you start exploring Azure Functions in detail, you can recognize a lot of scenarios where you can utilize this cloud service. Probably during your career, you had an opportunity to implement some of the following requirements in your solutions:

- Processing of uploaded files
- Processing of the real-time events
- Running scheduled tasks or reports
- Implementation of scalable web API

For all of these examples, we can utilize Azure Functions with different triggers or bindings. For the processing of the uploaded files, we would use Blob Storage as an input binding or trigger, processing of the real-time events would be covered with Event Hub binding or trigger, running scheduled tasks would be handled by using Timer as triggers, and implementation of scalable web API would use HTTP triggers.

### Introducing Triggers and Bindings

Azure Functions are triggered by events, as I’ve already mentioned. Based on those events, we need to choose specific **triggers or input bindings** and develop Azure Functions for different scenarios. Since different scenarios are triggered by different events, we can use the following triggers to start the Azure Function:

![Table 1: Example of Azure Function triggers and their purpose](/assets/blog/deep-dive-into-azure-functions-building-serverless-applications/02.png "Table 1: Example of Azure Function triggers and their purpose")

To access different resources we can use different bindings, shown in the table below:

![Table 2: Example of Azure Function bindings](/assets/blog/deep-dive-into-azure-functions-building-serverless-applications/03.png "Table 2: Example of Azure Function bindings")

- **Triggers** represent the cause of running a Function. We will show triggers later in the implementation details and see how we work with them.
- **Bindings** represent a way of connecting resources to Functions. We can use input and output bindings to connect Azure Function with different resources. The data from our bindings is provided to our Azure Functions as parameters. Bindings are a flexible way of handling events that are part of the Function logic, and we will show different examples later in the implementation section.

## Practical Use of Functions

### Azure Function Requirements

To deploy and use Azure Functions you’ll need an **Azure Subscription**. Besides that, you’ll need a **Storage Account**. Azure Functions need Storage Accounts for operations such as managing triggers and logging Function executions. However, if your Function is used to handle some intensive operations regarding storage, a new Storage Account should be created for that purpose.

### Exploring implementation samples — Handle Notifications via Email

In the example below we are going to show the basic implementation of an Azure Function responsible for sending emails. From the code snippet below, we can see that this Function is **HTTP triggered** based on the parameters that we have in the Run method. This method is automatically generated on Function creation and based on the trigger it will have different parameters.

```csharp
using Medium.Sample.Models;
using Medium.Sample.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Medium.Sample
{
    public class MediumEmailSender
    {
        private readonly IEmailService _emailService;

        public MediumEmailSender(IEmailService emailService)
        {
            _emailService = emailService;
        }

        /// <summary>
        /// Azure Function used to handle email send operation.
        /// </summary>
        /// <param name="req">Represents the incoming http request.</param>
        /// <param name="log">Represents the logger for the function.</param>
        /// <returns></returns>
        [FunctionName("MediumEmailSender")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req, ILogger log)
        {
            try
            {
                log.LogInformation("MediumEmailSender function invoked at {time}.", DateTime.UtcNow);

                var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                var mediumEmail = JsonConvert.DeserializeObject<MediumEmail>(requestBody);

                await _emailService.SendEmailAsync(mediumEmail);

                log.LogDebug("An email successfully sent at {time}.", DateTime.UtcNow);

                return new OkResult();
            }
            catch (Exception exception)
            {
                log.LogError(exception, "An error occurred while executing MediumEmailSender function.");
                throw;
            }
        }
    }
}
```

From this code snippet, we can see that this Azure Function has only one responsibility and that its implementation is very clear and simple. This should be the case with Azure Functions. This Function can scale automatically based on the system’s need to notify users about events. If the number of events or users increases, the scaling will handle higher loads, so we won’t have to worry about it.

In the next section, we will explore a way of refactoring this code, by utilizing bindings and making initial implementation even easier by removing email service implementation.

### Let’s explore Bindings

We’ve already mentioned **bindings**, but here we will use them in the actual implementation of an Azure Function. In the refactored code snippet below we have introduced **output binding** as new and easier way of sending email.

Let’s imagine that we need to update the first Azure Function so that it takes an attachment from **Blob Storage** and sends it using **SendGrid**. We have accomplished this by utilizing combination of triggers and bindings. As input, we are using **Blob Storage trigger** and as output, we are using **SendGrid binding**. Though it would be redundant in our situation as this trigger provides access to the blob, we could still use input binding to access the blob. Besides this, code logic did not change a lot.

A new code snippet introducing the input and output bindings is shown below:

```csharp
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using SendGrid.Helpers.Mail;
using System;
using System.IO;

namespace MediumEmailSender
{
    public static class MediumEmailSenderWithBindings
    {
        [FunctionName("MediumEmailSenderWithBindings")]
        public static void Run(
            [BlobTrigger("test-container/{name}", Connection = "AzureWebJobsStorage")] Stream myBlob,
            string name,
            ILogger log,
            [SendGrid(ApiKey = "SendGridApiKey")] out SendGridMessage message)
        {
            try
            {
                log.LogInformation("C# Blob trigger function processed a request.");

                // Convert blob to Base64 string used for attachments
                var blobAsBase64String = ConvertToAttachmentFormat(myBlob);

                // Create a SendGrid message
                message = new SendGridMessage();
                message.From = new EmailAddress("sender@email.com");
                message.AddTo("recipient@email.com");
                message.SetSubject("Blob Processed and Email Sent");
                message.AddContent("text/plain", "Test email content added.");

                // Attach the blob as attachment
                message.AddAttachment("attachment.png", blobAsBase64String, "image/png");
            }
            catch (Exception ex)
            {
                log.LogError(ex, "An error occurred.");
                throw;
            }
        }

        /// <summary>
        /// Converts a stream to a base64 string representing an attachment.
        /// </summary>
        /// <param name="blobStream">The stream to be converted.</param>
        /// <returns>A base64 string representing the attachment.</returns>
        private static string ConvertToAttachmentFormat(Stream blobStream)
        {
            if (blobStream == null)
                throw new ArgumentNullException(nameof(blobStream));

            using (var memoryStream = new MemoryStream())
            {
                blobStream.CopyTo(memoryStream);
                return Convert.ToBase64String(memoryStream.ToArray());
            }
        }
    }
}
```

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<STORAGE-ACCOUNT-CONNECTION-STRING>",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",
    "SendGridApiKey": "<SENDGRID-API-KEY>"
  }
}
```

Additionally, we had to configure the connection string for the Storage Account and API key for SendGrid in the app settings file. For the deployed Function this would be configured in the Configuration tab (part of the Azure Function resource page in Azure Portal).

After implementation, I started the Function and uploaded the blob in the container, as shown in the screenshot:

![Azure Portal view of the test-container blob container with attachment.png uploaded](/assets/blog/deep-dive-into-azure-functions-building-serverless-applications/04.jpg)

This action triggered the Function and a new email was sent, as shown below:

![Received email titled “Blob Processed and Email Sent”, sent through SendGrid, with the uploaded image attached](/assets/blog/deep-dive-into-azure-functions-building-serverless-applications/05.png)

This example demonstrated how to use bindings to further simplify the process of developing new logic.

After finishing the earlier parts, we expect to be able to identify various situations in which introducing Azure Functions could be useful. I’ll go over some of the most important aspects of Azure Functions in the text that follows that we could use in situations when comparing Azure Functions with alternative development methodologies.

### Key Features

As mentioned, in this section I will focus on key features of the Azure Functions so that you may assess the benefits of incorporating them into your software projects.

- **Event-driven coding** — This model allows developers to build code for specific scenarios or events. It helps to build a flexible and scalable architecture that can respond in the best way specific to some kind of event.
- **Multi-language support** — This service offers multi-language support. That means that we can use different languages to write business logic and everything else will be handled by the cloud provider.
- **Auto Scaling** — The option to dynamically scale your application based on demand ensures that your software responds well to demand and uses resources wisely. In the coming sections, we will explain different scaling options offered by different hosting plans.
- **Integration with other services —** Through the bindings example in the section above, we’ve shown that Azure Functions service easily integrates with other available services creating a powerful ecosystem for building applications. This helps developers to easily add new features to their applications.

## What about hosting?

Azure offers different types of hosting for this service. If you want to pay only for the execution time (when your app is being used), you can always opt for the **Consumption** plan. On the other hand, if you decide that you’d like to have your app instances ready for execution for the fastest response times you can decide to upgrade to the **Premium** plan.

One of the hosting options is using **App Service Plan** for Azure Functions. From my experience, this is a good option if you’d like to have a way to predict the cost of running this service more precisely. This is also called a **Dedicated** plan.

In the end, if you need to have full control over the runtime environment, Azure Functions can be deployed to fully customizable containers.

### How do hosting plans affect scaling?

In the previous section, we saw different options for hosting Azure Functions. Now, it is time to show how those hosting options are related to the scaling:

- **Consumption plan** — by choosing this hosting plan, scaling is completely event-driven. Scaling out will happen automatically, even when a high load occurs. CPU and memory resources will increase based on incoming trigger events. With this plan, Functions may scale to zero instances when idle. This means that some requests may have additional latency at startup.
- **Premium plan —** provides the scaling mechanism used on the Consumption plan (based on a number of events) but without cold start, enhanced performance, and VNET access.
- **Dedicated plan —** provides manual and autoscaling options. Since the Function host can run continuously the cold start should not be a problem.

If you choose to deploy Functions in a container there is additional information on scaling which will not be covered here, since I have not worked with these hosting options yet. More information about these can be found on this [link](https://learn.microsoft.com/en-us/azure/azure-functions/functions-kubernetes-keda).

### Function App Timeout and host plans

Choosing the host plan can affect Function timeout duration. Timeout duration represents the time that the Function needs to return a response after it was triggered, and it is set as the *functionTimeout* property in the *host.json* project file. Below you can see the default and maximum values per host plan for this property:

- **Consumption** — default is **5** and maximum is **10**
- **Premium** — default is **30** and the maximum is **unlimited**
- **Dedicated** — default is **30** and maximum is **unlimited**

This is one more reason to carefully choose a proper host plan based on your app requirements.

## Conclusion

Azure Functions is a serverless computing service that allows developers to focus solely on business logic when designing apps with high scalability and efficiency level. It is an ideal solution for many use cases because of its scalability, event-driven design, multi-language support, and built in connectivity with Azure services. All these features allow delivering the final product faster.

As more and more companies begin to use serverless computing, modern software developers will also find it beneficial to learn how to work with Azure Functions. After the developers learn about the primary aspects and good practices explained in this article, they can utilize Azure Functions to develop solid and scalable serverless applications. If you want to understand more details about serverless architecture based on Azure Functions then you can check Durable Functions mentioned below.

### Next step: Durable Functions

> *Durable Functions* is an extension of [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview) that lets you write stateful functions in a serverless compute environment

If you find Azure Functions interesting, you should investigate more into the Durable Functions extension. If you have complex or long-running tasks where timeouts or issues with the state can occur, looking into Durable Functions seems like a good idea. You can use this extension to create stateful workflows by defining the sequence of Function calls and handling errors. Also, it is an easy method for distributed systems to manage shared state. By focusing on key aspects, you’ll build a strong foundation for understanding Durable Functions in Azure.

This [Microsoft article](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?tabs=in-process%2Cnodejs-v3%2Cv1-model&pivots=csharp) provides further information about Durable Functions and examples of various design scenarios that employ them.
